import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { HeaderDashboard } from '@shared/components/header-dashboard/header-dashboard';
import { Copyright } from '@shared/components/copyright/copyright';
import { SubscriptionStatusBanner } from '@shared/components/subscription-status-banner/subscription-status-banner';
import { AdSlot } from '@shared/components/ad-slot/ad-slot';
import { ModalAdService } from '@shared/services/modal-ad.service';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { SocketService } from 'src/app/features/notifications/socket.service';
import { OrdersService } from 'src/app/features/orders/orders.service';

/** Estatus "Pagado": ordenes esperando que el vendedor verifique el comprobante */
const PAID_STATUS_ID = 2;

/** Espera antes del primer popup, para no recibir al usuario con un modal de golpe */
const MODAL_AD_INITIAL_DELAY_MS = 8_000;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NbIconModule, NbEvaIconsModule, HeaderDashboard, Copyright, SubscriptionStatusBanner, AdSlot],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private auth = inject(AuthService);
  private socket = inject(SocketService);
  private toast = inject(ToastService);
  private ordersService = inject(OrdersService);
  private modalAdService = inject(ModalAdService);

  /** Solo el usuario master administra los usuarios de la empresa */
  is_admin = computed(() => this.auth.session()?.role?.slug === 'admin');

  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Menu lateral en modo telefono: cerrado por defecto, siempre visible en desktop */
  is_menu_open = signal(false);

  /** Ordenes pagadas a la espera de que el vendedor las verifique: insignia del menu */
  paid_orders_count = signal(0);

  /**
   * Nebular pone `text-decoration: underline` y un color propio a todos los
   * `<a>` de la app (regla global de mas especificidad que una clase suelta
   * de Tailwind), por eso el color y el subrayado van con "!" para ganarle.
   * Un solo string por estado evita que texto-negro y texto-azul convivan a
   * la vez en el elemento (el orden de las clases en el HTML no garantiza
   * cual gana cuando ambas son "!important").
   */
  protected readonly NAV_LINK_CLASS =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black! no-underline! transition-colors hover:bg-blue-50';
  protected readonly NAV_LINK_ACTIVE_CLASS =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600! bg-blue-50 no-underline!';

  toggleMenu(): void {
    this.is_menu_open.update((value) => !value);
    this.syncBodyScroll();
  }

  closeMenu(): void {
    this.is_menu_open.set(false);
    this.syncBodyScroll();
  }

  /** Evita que el fondo haga scroll mientras el menu overlay esta abierto en telefono */
  private syncBodyScroll(): void {
    if (!this.is_browser) return;
    document.body.classList.toggle('overflow-hidden', this.is_menu_open());
  }

  ngOnInit(): void {
    if (this.is_browser) {
      this.loadPaidOrdersCount();
      this.modalAdService.start('modal', MODAL_AD_INITIAL_DELAY_MS);
    }

    this.socket.connect();

    // Le llega al vendedor dueño de la orden y, siempre, al administrador.
    // Si el pago quedó sospechoso, eso se ve en el renglón de la orden (fondo
    // amarillo), no hace falta un toast distinto para eso.
    this.socket.onOrderPaid((payload) => {
      const reference = payload.reference ? `referencia ${payload.reference}` : 'sin referencia detectada';
      this.toast.success(`${payload.buyer_name} subió su comprobante (${reference}).`, '💰 Nuevo pago');

      // Un pago nuevo entra como "Pagado": suma a la insignia de pendientes por verificar
      this.loadPaidOrdersCount();
    });

    // Cualquier cambio de estado (verificado, rechazado, etc.) tambien
    // refresca la insignia, sin importar desde que pantalla/sesion se hizo
    this.socket.onOrderStatusChanged(() => this.loadPaidOrdersCount());
  }

  /** Cuenta las ordenes en estado "Pagado" para la insignia del menu */
  private loadPaidOrdersCount(): void {
    this.ordersService.getOrders({ status_id: PAID_STATUS_ID, page: 1, limit: 1 }).subscribe({
      next: (response) => this.paid_orders_count.set(response.total),
      error: () => { }
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    this.modalAdService.stop();
    if (this.is_browser) document.body.classList.remove('overflow-hidden');
  }
}
