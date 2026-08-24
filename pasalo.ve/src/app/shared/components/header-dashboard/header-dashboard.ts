import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Output, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NbButtonModule, NbIconModule, NbTooltipModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from 'src/app/features/auth/auth.service';
import { NotificationBell } from 'src/app/features/notifications/components/notification-bell/notification-bell';
import { Avatar } from '@shared/components/avatar/avatar';

/** Pixeles de scroll a partir de los cuales el header deja de ser transparente */
const SCROLL_THRESHOLD = 8;

@Component({
  selector: 'app-header-dashboard',
  templateUrl: './header-dashboard.html',
  imports: [NbButtonModule, NbIconModule, NbEvaIconsModule, NbTooltipModule, NotificationBell, Avatar],
  // El sticky vive en el host: el <header> interno solo pinta, asi el elemento
  // del componente es el que se ancla arriba y ocupa el ancho completo.
  host: { class: 'sticky top-0 z-30 block' },
})
export class HeaderDashboard {

  protected auth = inject(AuthService);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** El menu lateral en modo telefono vive en el Dashboard; aca solo se avisa */
  @Output() menuToggle = new EventEmitter<void>();

  is_scrolled = signal(false);

  constructor() {
    if (!this.is_browser) return;

    // El listener se registra a mano (y no con @HostListener) a proposito: la app
    // es zoneless, y un host listener le avisa al scheduler en *cada* evento de
    // scroll, disparando change detection decenas de veces por segundo. Un
    // listener nativo no notifica nada; solo lo hace el signal, y como `set` con
    // el mismo valor no emite, la CD corre unicamente en los dos cambios reales.
    // El rAF ademas limita la lectura de scrollY a una por frame.
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        this.is_scrolled.set(window.scrollY > SCROLL_THRESHOLD);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
