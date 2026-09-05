import { Component, OnInit, inject, signal } from '@angular/core';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { ToastService } from '@shared/services/toast.service';
import { PushSubscriptionService } from '../../push-subscription.service';

const PERMISSION_ERRORS = {
  unsupported: 'Este navegador no soporta notificaciones push.',
  'permission-denied': 'Bloqueaste las notificaciones. Habilítalas desde los ajustes del navegador para este sitio.',
  browser: 'El navegador no pudo registrar las notificaciones. Recarga la página e inténtalo de nuevo.',
  backend: 'No pudimos guardar tus notificaciones en el servidor. Inténtalo de nuevo en un momento.',
} as const;

@Component({
  selector: 'app-push-permission-prompt',
  imports: [NbButtonModule, NbIconModule],
  templateUrl: './push-permission-prompt.html',
})
export class PushPermissionPrompt implements OnInit {

  private push = inject(PushSubscriptionService);
  private toast = inject(ToastService);

  visible = signal(false);
  is_subscribing = signal(false);

  ngOnInit(): void {
    // Solo se muestra si el navegador soporta push Y el usuario todavia no
    // decidio nada (default). Si ya lo denego o ya lo acepto, no se vuelve
    // a preguntar: pedir el permiso solo debe pasar por un click explicito.
    this.visible.set(this.push.isSupported && this.push.permission === 'default');
  }

  async enable(): Promise<void> {
    if (this.is_subscribing()) return;

    this.is_subscribing.set(true);
    const result = await this.push.subscribe();
    this.is_subscribing.set(false);
    this.visible.set(false);

    if (result.ok) {
      this.toast.success('Te avisaremos cuando recibas un pago.', '🔔 Notificaciones activadas');
      return;
    }

    this.toast.warning(PERMISSION_ERRORS[result.reason]);
  }

  dismiss(): void {
    this.visible.set(false);
  }
}
