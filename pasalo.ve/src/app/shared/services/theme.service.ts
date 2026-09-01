import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { NbThemeService } from '@nebular/theme';

const STORAGE_KEY = 'pasalo-theme';

/**
 * El tema oscuro solo aplica al dashboard interno: Dashboard llama a
 * `applyStoredPreference()` en su ngOnInit y a `reset()` en su ngOnDestroy,
 * asi la landing y el pago publico (que viven fuera de ese layout) siempre
 * se ven con el tema claro sin importar la preferencia guardada.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {

  private nbTheme = inject(NbThemeService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  is_dark = signal(this.is_browser && localStorage.getItem(STORAGE_KEY) === 'dark');

  applyStoredPreference(): void {
    if (this.is_dark()) this.nbTheme.changeTheme('dark');
  }

  reset(): void {
    this.nbTheme.changeTheme('default');
  }

  toggle(): void {
    const next = !this.is_dark();
    this.is_dark.set(next);
    this.nbTheme.changeTheme(next ? 'dark' : 'default');
    if (this.is_browser) localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }
}
