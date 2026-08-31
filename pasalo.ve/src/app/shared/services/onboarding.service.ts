import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Driver, DriveStep } from 'driver.js';
import { AuthService } from 'src/app/features/auth/auth.service';
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
  {
    route: '/dashboard/form',
    element: '[data-tour="order-items"]',
    title: '4. Crea tu primera orden',
    description: 'Carga los productos con su nombre y precio; con "Agregar producto" sumas más renglones. Los datos del comprador los llena él mismo al abrir el link.',
    side: 'bottom',
  },
  {
    route: '/dashboard/form',
    element: '[data-tour="order-submit"]',
    title: '4. Genera el link de pago',
    description: 'Al crear la orden se genera un link único. Ese es el que le vas a enviar a tu cliente.',
    side: 'top',
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
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * true mientras el onboarding esta en pantalla: tanto la pregunta inicial
   * como el tour. `ModalAdService` lo mira para no tirar publicidad encima.
   */
  is_running = signal(false);

  private driverObj: Driver | null = null;

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
    const steps = this.visibleSteps();
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
        this.is_running.set(false);
        this.driverObj = null;
      },
    });

    await this.goToRoute(steps[0].route);
    this.driverObj.drive();
  }

  stop(): void {
    this.driverObj?.destroy();
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

  /** Un vendedor no admin no ve metodos de pago ni empresa: esos pasos se saltan */
  private visibleSteps(): TourStep[] {
    const is_admin = this.auth.session()?.role?.slug === 'admin';
    return TOUR_STEPS.filter((step) => !step.adminOnly || is_admin);
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
