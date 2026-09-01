import { Component, DestroyRef, ElementRef, EventEmitter, Output, afterNextRender, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NbButtonModule, NbIconModule, NbTooltipModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AuthService } from 'src/app/features/auth/auth.service';
import { NotificationBell } from 'src/app/features/notifications/components/notification-bell/notification-bell';
import { Avatar } from '@shared/components/avatar/avatar';
import { ThemeService } from '@shared/services/theme.service';

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
  protected theme = inject(ThemeService);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private host = inject(ElementRef<HTMLElement>);

  /** El menu lateral en modo telefono vive en el Dashboard; aca solo se avisa */
  @Output() menuToggle = new EventEmitter<void>();

  /** El header dejo de estar en su sitio y quedo anclado arriba: recien ahi va el glass */
  is_pinned = signal(false);

  constructor() {
    // No se escucha el scroll a proposito. Lo que interesa no es cuanto se bajo,
    // sino el momento exacto en que el sticky se despega de su lugar y queda
    // anclado arriba, y eso el navegador lo puede avisar solo.
    //
    // El truco: se observa el propio header contra un viewport recortado 1px
    // desde arriba (rootMargin). Mientras esta en su sitio se ve entero
    // (ratio 1); apenas se ancla en top:0 ese 1px lo tapa y el ratio baja de 1.
    //
    // Frente a un listener de scroll esto es mejor en telefono por dos razones:
    // el navegador lo resuelve fuera del camino del scroll (no hay trabajo por
    // frame), y como la app es zoneless, el callback nativo no dispara change
    // detection: solo la dispara el signal, que cambia dos veces y no mas.
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        ([entry]) => this.is_pinned.set(entry.intersectionRatio < 1),
        { threshold: [1], rootMargin: '-1px 0px 0px 0px' },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
