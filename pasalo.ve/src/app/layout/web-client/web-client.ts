import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { Footer } from 'src/app/shared/components/footer/footer';
import { Copyright } from 'src/app/shared/components/copyright/copyright';
import { AuthService } from 'src/app/features/auth/auth.service';
import { ModalAdService } from '@shared/services/modal-ad.service';

/** Espera antes del primer popup, para no recibir al visitante con un modal de golpe */
const MODAL_AD_INITIAL_DELAY_MS = 8_000;

@Component({
  selector: 'app-web-client',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NbButtonModule, Footer, Copyright],
  templateUrl: './web-client.html',
  styleUrl: './web-client.scss',
})
export class WebClient implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private modalAdService = inject(ModalAdService);

  readonly is_logged_in = this.auth.is_logged_in;
  readonly menu_open = signal(false);

  constructor() {
    // Cierra el menu movil al navegar (incluye clicks en anclas con fragment)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.menu_open.set(false);
    });
  }

  ngOnInit(): void {
    this.modalAdService.start('modal', MODAL_AD_INITIAL_DELAY_MS);
  }

  ngOnDestroy(): void {
    this.modalAdService.stop();
  }

  toggleMenu(): void {
    this.menu_open.update((open) => !open);
  }
}
