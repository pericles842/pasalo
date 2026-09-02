import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Google Identity Services no tiene tipos oficiales instalados en el
 * proyecto; se declara el minimo que se usa (initialize/renderButton) en vez
 * de traer @types/google.accounts como dependencia solo para esto.
 */
declare const google: {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(parent: HTMLElement, options: { theme?: string; size?: string; width?: number; text?: string }): void;
    };
  };
};

/**
 * Carga el script de Google Identity Services y dibuja el boton oficial
 * "Continuar con Google". Se usa tanto en el login como en el registro de
 * empresa: cada pantalla decide que hacer con el id_token resultante.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {

  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));
  private script_promise: Promise<void> | null = null;

  private loadScript(): Promise<void> {
    if (this.script_promise) return this.script_promise;

    this.script_promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
      document.head.appendChild(script);
    });

    return this.script_promise;
  }

  /**
   * Dibuja el boton de Google dentro de `container`. Cada vez que alguien lo
   * usa para entrar, `onCredential` recibe el id_token para verificar contra
   * el backend (ver AuthService.loginWithGoogle).
   */
  async renderButton(container: HTMLElement, onCredential: (id_token: string) => void): Promise<void> {
    if (!this.is_browser) return;

    await this.loadScript();

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => onCredential(response.credential),
    });
    google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
  }
}
