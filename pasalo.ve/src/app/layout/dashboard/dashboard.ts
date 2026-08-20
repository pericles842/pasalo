import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { HeaderDashboard } from '@shared/components/header-dashboard/header-dashboard';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from 'src/app/features/auth/auth.service';
import { SocketService } from 'src/app/features/notifications/socket.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NbButtonModule, HeaderDashboard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private auth = inject(AuthService);
  private socket = inject(SocketService);
  private toast = inject(ToastService);

  /** Solo el usuario master administra los usuarios de la empresa */
  is_admin = computed(() => this.auth.session()?.role?.slug === 'admin');

  /** Menu lateral en modo telefono: cerrado por defecto, siempre visible en desktop */
  is_menu_open = signal(false);

  toggleMenu(): void {
    this.is_menu_open.update((value) => !value);
  }

  closeMenu(): void {
    this.is_menu_open.set(false);
  }

  ngOnInit(): void {
    this.socket.connect();

    // Le llega al vendedor dueño de la orden y, siempre, al administrador
    this.socket.onOrderPaid((payload) => {
      const reference = payload.reference ? `referencia ${payload.reference}` : 'sin referencia detectada';

      if (payload.is_suspicious) {
        this.toast.warning(
          `${payload.buyer_name} subió un comprobante pero el monto no coincide (${reference}). Revísalo antes de confirmar.`,
          '⚠️ Pago sospechoso'
        );
      } else {
        this.toast.success(`${payload.buyer_name} completó su pago (${reference}).`, '💰 Nuevo pago recibido');
      }
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
