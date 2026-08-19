import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protege el dashboard. En el servidor deja pasar:
 * el token vive en el navegador y la API igual valida cada request.
 */
export const authGuard: CanActivateFn = () => {
  const is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  if (!is_browser) return true;

  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.token ? true : router.parseUrl('/login');
};
