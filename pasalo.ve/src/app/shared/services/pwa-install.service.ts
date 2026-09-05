import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {

  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** Chrome/Edge/Android: hay un prompt nativo listo para disparar */
  canInstall = signal(false);
  /** Ya esta corriendo instalada (display-mode: standalone) */
  isInstalled = signal(false);
  /** iOS Safari nunca dispara beforeinstallprompt: se resuelve con instrucciones manuales */
  isIos = signal(false);

  constructor() {
    if (!this.is_browser) return;

    this.isInstalled.set(window.matchMedia('(display-mode: standalone)').matches);
    this.isIos.set(/iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window));

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });
  }

  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;

    await this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }
}
