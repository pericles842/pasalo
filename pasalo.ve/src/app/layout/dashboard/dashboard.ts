import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { HeaderDashboard } from '@shared/components/header-dashboard/header-dashboard';
import { Copyright } from '@shared/components/copyright/copyright';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { SocketService } from 'src/app/features/notifications/socket.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NbButtonModule, HeaderDashboard, Copyright],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private auth = inject(AuthService);
  private socket = inject(SocketService);
  private toast = inject(ToastService);

  /** Solo el usuario master administra los usuarios de la empresa */
  is_admin = computed(() => this.auth.session()?.role?.slug === 'admin');

  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Menu lateral en modo telefono: cerrado por defecto, siempre visible en desktop */
  is_menu_open = signal(false);

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
    this.socket.connect();

    // Le llega al vendedor dueño de la orden y, siempre, al administrador.
    // Si el pago quedó sospechoso, eso se ve en el renglón de la orden (fondo
    // amarillo), no hace falta un toast distinto para eso.
    this.socket.onOrderPaid((payload) => {
      const reference = payload.reference ? `referencia ${payload.reference}` : 'sin referencia detectada';
      this.toast.success(`${payload.buyer_name} subió su comprobante (${reference}).`, '💰 Nuevo pago');
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
    if (this.is_browser) document.body.classList.remove('overflow-hidden');
  }
}
