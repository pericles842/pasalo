import { Component, inject, signal } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { Footer } from 'src/app/shared/components/footer/footer';
import { Copyright } from 'src/app/shared/components/copyright/copyright';
import { AuthService } from 'src/app/features/auth/auth.service';

@Component({
  selector: 'app-web-client',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NbButtonModule, Footer, Copyright],
  templateUrl: './web-client.html',
  styleUrl: './web-client.scss',
})
export class WebClient {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly is_logged_in = this.auth.is_logged_in;
  readonly menu_open = signal(false);

  constructor() {
    // Cierra el menu movil al navegar (incluye clicks en anclas con fragment)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.menu_open.set(false);
    });
  }

  toggleMenu(): void {
    this.menu_open.update((open) => !open);
  }
}
