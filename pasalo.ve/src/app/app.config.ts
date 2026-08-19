import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { NbOverlayContainerAdapter, NbThemeModule, NbToastrModule } from '@nebular/theme';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './shared/interceptors/loading.interceptor';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { OverlayContainer } from '@angular/cdk/overlay';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Nebular usa animaciones (overlays, stepper, select): sin esto revientan en runtime
    provideAnimationsAsync(),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(NbThemeModule.forRoot({ name: 'default' })),
    importProvidersFrom(NbToastrModule.forRoot()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    {
      provide: NbOverlayContainerAdapter,
      useClass: OverlayContainer
    },
  ],
};
