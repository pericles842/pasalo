import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { HeaderDashboard } from '@shared/components/header-dashboard/header-dashboard';
import { AuthService } from 'src/app/features/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NbButtonModule, HeaderDashboard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  private auth = inject(AuthService);

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
}
