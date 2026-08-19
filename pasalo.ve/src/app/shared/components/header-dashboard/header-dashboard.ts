import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { AuthService } from 'src/app/features/auth/auth.service';

@Component({
  selector: 'app-header-dashboard',
  templateUrl: './header-dashboard.html',
  imports: [NbButtonModule],
})
export class HeaderDashboard {

  protected auth = inject(AuthService);

  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
