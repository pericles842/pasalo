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

    // El propio service worker ya navega al listado (via onActionClick en el
    // payload del push). Esto cubre el caso de la app abierta en primer plano,
    // donde conviene resolverlo con el router en vez de recargar la pagina.
    this.swPush.notificationClicks.subscribe(() => {
      this.router.navigate(['/dashboard/list']);
    });
  }
}
