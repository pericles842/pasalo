import { Component, OnInit, inject, signal } from '@angular/core';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { ToastService } from '@shared/services/toast.service';
import { PushSubscriptionService } from '../../push-subscription.service';

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
    const ok = await this.push.subscribe();
    this.is_subscribing.set(false);
    this.visible.set(false);

    if (ok) this.toast.success('Te avisaremos cuando recibas un pago.', '🔔 Notificaciones activadas');
    else this.toast.warning('No pudimos activar las notificaciones.');
  }

  dismiss(): void {
    this.visible.set(false);
  }
}
