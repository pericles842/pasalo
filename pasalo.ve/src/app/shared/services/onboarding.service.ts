import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import type { Driver, DriveStep } from 'driver.js';
import { AuthService } from 'src/app/features/auth/auth.service';
import { PaymentMethodsService } from 'src/app/features/payment-methods/payment-methods.service';
import { ConfirmService } from './confirm.service';

/** Una vez que el usuario contesta (si o no), no se le vuelve a preguntar en ese navegador */
const STORAGE_KEY = 'pasalo_onboarding_prompted';

/** Cuanto espera driver.js a que aparezca el elemento despues de navegar */
const WAIT_FOR_ELEMENT_MS = 4000;

interface TourStep {
  /** Ruta del dashboard donde vive el paso; el tour navega solo si hace falta */
  route: string;
  /** Selector del elemento real a resaltar. Sin esto, el paso sale centrado */
  element?: string;
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Metodos de pago y empresa solo los administra el usuario master */
  adminOnly?: boolean;
  /**
   * Sin metodos de pago cargados, la pantalla de crear orden no renderiza el
   * formulario (muestra el aviso para cargar uno): esos pasos apuntarian a
   * elementos que no existen. Cada paso declara en que estado tiene sentido.
   */
  needsPaymentMethods?: boolean;
  onlyWithoutPaymentMethods?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    route: '/dashboard/payment-methods',
    element: '[data-tour="payment-method-form"]',
    title: '1. Crea tu método de pago',
    description: 'Elige el tipo (pago móvil, transferencia o billetera digital) y completa los datos que te pide abajo. Sin al menos un método, tus clientes no pueden pagarte.',
    side: 'bottom',
    adminOnly: true,
  },
  {
    route: '/dashboard/profile',
    element: '[data-tour="profile-photo"]',
    title: '2. Sube tu foto de perfil',
    description: 'Haz clic sobre el círculo para subir tu foto. Es lo que ve tu cliente cuando abre el link de pago.',
    side: 'bottom',
  },
  {
    route: '/dashboard/company',
    element: '[data-tour="company-logo"]',
    title: '2. Sube el logo de tu empresa',
    description: 'Igual que tu foto: haz clic en el círculo y elige el logo. Así tu marca aparece en el link que compartes.',
    side: 'bottom',
    adminOnly: true,
  },
  {
    route: '/dashboard/company',
    element: '[data-tour="company-rate"]',
    title: '3. Elige con qué moneda trabajas',
    description: 'Selecciona si tus precios se convierten a bolívares con la tasa BCV, EUR o el promedio de ambas. Es la tasa que verá tu cliente.',
    side: 'top',
    adminOnly: true,
  },
  // Todavia sin metodos de pago: la pantalla solo muestra el aviso, asi que el
  // paso resalta ese aviso en vez de un formulario que no existe.
  {
    route: '/dashboard/form',
    element: '[data-tour="order-no-methods"]',
    title: '4. Aquí vas a crear tus órdenes',
    description: 'Por ahora ves este aviso porque todavía no cargaste un método de pago. En cuanto agregues uno, esta pantalla te muestra el formulario para cargar los productos de la venta.',
    side: 'bottom',
    onlyWithoutPaymentMethods: true,
  },
  {
    route: '/dashboard/form',
    element: '[data-tour="order-items"]',
    title: '4. Crea tu primera orden',
    description: 'Carga los productos con su nombre y precio; con "Agregar producto" sumas más renglones. Los datos del comprador los llena él mismo al abrir el link.',
    side: 'bottom',
    needsPaymentMethods: true,
  },
  {
    route: '/dashboard/form',
    element: '[data-tour="order-submit"]',
    title: '4. Genera el link de pago',
    description: 'Al crear la orden se genera un link único. Ese es el que le vas a enviar a tu cliente.',
    side: 'top',
    needsPaymentMethods: true,
  },
  {
    route: '/dashboard/form',
    title: '¡Listo! Envíaselo por WhatsApp',
    description: 'Cuando crees la orden vas a ver el link con los botones "Copiar link" y "Enviar por WhatsApp". Tu cliente lo abre, paga y sube su comprobante — y a ti te llega el aviso al instante.',
  },
];

/**
 * Tour guiado del dashboard: oscurece la pantalla, resalta el elemento real
 * de cada paso y acompaña al usuario navegando entre pantallas (metodos de
 * pago -> perfil -> empresa -> crear orden). Usa driver.js, que se carga
 * dinamico para que no entre en el bundle del SSR.
 *
 * Se ofrece una sola vez por navegador (gate de localStorage, no hay campo en
 * el backend), y se puede relanzar a mano desde el menu con `start()`.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {

  private confirm = inject(ConfirmService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * true mientras el onboarding esta en pantalla: tanto la pregunta inicial
   * como el tour. `ModalAdService` lo mira para no tirar publicidad encima.
   */
  is_running = signal(false);

  private driverObj: Driver | null = null;

  /** Reposiciona el globo cuando la pantalla termina de cargar y crece (ver watchLayoutShifts) */
  private layout_observer: ResizeObserver | null = null;

  /** Pregunta una sola vez por navegador; si acepta, arranca el tour */
  maybeStart(): void {
    if (!this.is_browser || this.is_running() || localStorage.getItem(STORAGE_KEY)) return;

    this.is_running.set(true);

    this.confirm.ask({
      title: 'Bienvenido a Pásalo',
      message: '¿Quieres que te muestre paso a paso cómo dejar tu cuenta lista para vender? Te voy acompañando por cada pantalla.',
      confirmLabel: 'Sí, muéstrame',
      cancelLabel: 'Ahora no',
      status: 'primary',
    }).subscribe((wantsTour) => {
      localStorage.setItem(STORAGE_KEY, '1');

      if (wantsTour) this.runTour();
      else this.is_running.set(false);
    });
  }

  /** Relanza el tour a pedido (boton "Ver tutorial" del menu) */
  start(): void {
    if (!this.is_browser || this.is_running()) return;

    this.is_running.set(true);
    this.runTour();
  }

  private async runTour(): Promise<void> {
    const steps = await this.visibleSteps();
    if (!steps.length) {
      this.is_running.set(false);
      return;
    }

    const { driver } = await import('driver.js');

    this.driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Finalizar',
      allowClose: true,
      smoothScroll: true,
      // Estilos del globo con la identidad de Pásalo (ver styles.scss)
      popoverClass: 'pasalo-tour',
      // Un clic en el fondo oscuro no cierra nada: el tour solo se sale con la
      // X (o Escape), asi no se pierde de golpe mientras hace el paso
      overlayClickBehavior: () => { },
      // El tour es solo explicativo: mientras corre no se interactua con nada,
      // ni siquiera con el elemento resaltado (si no, se abren desplegables de
      // Nebular por encima del globo y se pierde el hilo del paso a paso).
      disableActiveInteraction: true,
      // Tras navegar, el elemento tarda un toque en renderizar
      waitForElement: WAIT_FOR_ELEMENT_MS,
      // Si una pantalla no tiene el elemento (ej. otro rol), no rompe el tour
      skipMissingElement: true,
      overlayColor: '#0f172a',
      overlayOpacity: 0.7,
      stagePadding: 8,
      stageRadius: 12,
      // Separacion entre el globo y el elemento: con el default (10px) el globo
      // queda pegado y, en pantallas chicas, se monta encima de lo que resalta
      popoverOffset: 16,
      steps: steps.map((step) => this.toDriveStep(step)),
      onNextClick: () => this.move(steps, 1),
      onPrevClick: () => this.move(steps, -1),
      onDestroyed: () => {
        this.stopWatchingLayout();
        this.is_running.set(false);
        this.driverObj = null;
      },
    });

    await this.goToRoute(steps[0].route);
    this.driverObj.drive();
    this.watchLayoutShifts();
  }

  stop(): void {
    this.driverObj?.destroy();
  }

  /**
   * Cada pantalla termina de armarse despues del primer render (la tarjeta del
   * plan, la barra de consumo, los slots de publicidad, la tasa de cambio...) y
   * eso empuja el contenido hacia abajo. driver.js solo recalcula la posicion
   * con el scroll y el resize de la ventana, no cuando crece el contenido: sin
   * esto el recuadro y el globo quedan apuntando a donde el elemento *estaba*.
   *
   * Se observa el alto del body y se reposiciona, en vez de esperar la carga de
   * cada pantalla una por una (habria que ir descubriendolas todas, y cada
   * pantalla nueva volveria a romper el tour).
   */
  private watchLayoutShifts(): void {
    if (typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    this.layout_observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      // Un frame de gracia: si entran varios cambios juntos, se recalcula una vez
      frame = requestAnimationFrame(() => {
        if (this.driverObj?.isActive()) this.driverObj.refresh();
      });
    });

    this.layout_observer.observe(document.body);
  }

  private stopWatchingLayout(): void {
    this.layout_observer?.disconnect();
    this.layout_observer = null;
  }

  /** El paso siguiente puede vivir en otra pantalla: primero navega, despues resalta */
  private async move(steps: TourStep[], delta: number): Promise<void> {
    const driverObj = this.driverObj;
    if (!driverObj) return;

    const index = driverObj.getActiveIndex() ?? 0;
    const nextIndex = index + delta;

    if (nextIndex < 0) return;
    if (nextIndex >= steps.length) {
      driverObj.destroy();
      return;
    }

    if (steps[nextIndex].route !== steps[index].route) {
      await this.goToRoute(steps[nextIndex].route);
    }

    driverObj.moveTo(nextIndex);
  }

  private async goToRoute(route: string): Promise<void> {
    if (this.router.url.split('?')[0] === route) return;
    await this.router.navigateByUrl(route);
  }

  /**
   * Arma los pasos segun el estado real de la cuenta:
   * - un vendedor no admin no ve metodos de pago ni empresa;
   * - sin metodos de pago cargados, la pantalla de crear orden solo muestra el
   *   aviso, asi que se usa la variante de paso que resalta ese aviso.
   */
  private async visibleSteps(): Promise<TourStep[]> {
    const is_admin = this.auth.session()?.role?.slug === 'admin';
    const has_payment_methods = await this.hasPaymentMethods();

    return TOUR_STEPS.filter((step) => {
      if (step.adminOnly && !is_admin) return false;
      if (step.needsPaymentMethods && !has_payment_methods) return false;
      if (step.onlyWithoutPaymentMethods && has_payment_methods) return false;
      return true;
    });
  }

  /** Si la consulta falla se asume que si tiene: es el camino normal del tour */
  private hasPaymentMethods(): Promise<boolean> {
    return firstValueFrom(
      this.paymentMethodsService.getPaymentMethods().pipe(
        catchError(() => of(null)),
      ),
    ).then((response) => (response ? response.methods.length > 0 : true));
  }

  private toDriveStep(step: TourStep): DriveStep {
    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? 'bottom',
        align: 'start',
      },
    };
  }
}
