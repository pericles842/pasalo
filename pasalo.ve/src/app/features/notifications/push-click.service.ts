import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class PushClickService {

  private swPush = inject(SwPush);
  private router = inject(Router);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Se llama una sola vez desde la raiz de la app (App). */
  listen(): void {
    if (!this.is_browser || !this.swPush.isEnabled) return;

    this.swPush.notificationClicks.subscribe(({ notification }) => {
      const order_id = (notification.data as { order_id?: string } | undefined)?.order_id;
      if (order_id) this.router.navigate(['/dashboard', order_id]);
    });
  }
}
