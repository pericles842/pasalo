import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

/** En que paso fallo la suscripcion: el navegador, el permiso, o guardarla en el backend */
export type PushSubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'permission-denied' | 'browser' | 'backend' };

@Injectable({ providedIn: 'root' })
export class PushSubscriptionService {

  private http = inject(HttpClient);
  private swPush = inject(SwPush);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  get isSupported(): boolean {
    return this.is_browser && this.swPush.isEnabled && 'Notification' in window;
  }

  get permission(): NotificationPermission | null {
    return this.is_browser && 'Notification' in window ? Notification.permission : null;
  }

  /**
   * Pide permiso (si hace falta) y registra la suscripción push en el backend.
   * Devuelve en que paso fallo, para poder decirle al usuario algo util en vez
   * de un "no se pudo" generico (y para que quede en consola al depurar).
   */
  async subscribe(): Promise<PushSubscribeResult> {
    if (!this.isSupported) return { ok: false, reason: 'unsupported' };

    let subscription: PushSubscription;

    try {
      subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });
    } catch (err) {
      console.error('[push] el navegador rechazo la suscripcion', err);
      return { ok: false, reason: this.permission === 'denied' ? 'permission-denied' : 'browser' };
    }

    try {
      await firstValueFrom(this.http.post(`${environment.host}/push-subscriptions`, subscription.toJSON()));
      return { ok: true };
    } catch (err) {
      console.error('[push] el backend no pudo guardar la suscripcion', err);
      return { ok: false, reason: 'backend' };
    }
  }

  /**
   * Borra la suscripción del lado del backend, para que deje de recibir
   * push. `SwPush` no expone un unsubscribe() propio en Angular, asi que del
   * lado del navegador la suscripcion queda registrada pero inofensiva: el
   * servidor ya no le manda nada.
   */
  async unsubscribe(): Promise<void> {
    if (!this.is_browser) return;

    const sub = await firstValueFrom(this.swPush.subscription).catch(() => null);
    if (!sub) return;

    await firstValueFrom(
      this.http.request('delete', `${environment.host}/push-subscriptions`, { body: { endpoint: sub.endpoint } })
    ).catch(() => {});
  }
}
