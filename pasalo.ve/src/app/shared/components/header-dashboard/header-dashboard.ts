import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from 'src/app/features/auth/auth.service';
import { NotificationBell } from 'src/app/features/notifications/components/notification-bell/notification-bell';

@Component({
  selector: 'app-header-dashboard',
  templateUrl: './header-dashboard.html',
  imports: [NbButtonModule, NbIconModule, NbEvaIconsModule, NotificationBell],
})
export class HeaderDashboard {

  protected auth = inject(AuthService);

  private router = inject(Router);

  /** El menu lateral en modo telefono vive en el Dashboard; aca solo se avisa */
  @Output() menuToggle = new EventEmitter<void>();

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
