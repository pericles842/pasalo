import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { NbDatepickerModule, NbDialogModule, NbOverlayContainerAdapter, NbThemeModule, NbToastrModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';

import { routes } from './app.routes';
import { SeoTitleStrategy } from './core/seo-title-strategy';
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
    // 'enabled': permite que los links con [fragment] (nav de la landing) hagan scroll
    // a la seccion aunque se navegue desde otra pagina, no solo dentro de la misma.
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    // Nebular usa animaciones (overlays, stepper, select): sin esto revientan en runtime
    provideAnimationsAsync(),
    provideClientHydration(withEventReplay()),
    importProvidersFrom(NbThemeModule.forRoot({ name: 'default' })),
    // Registra el pack de iconos Eva como pack por defecto: sin esto nb-icon
    // lanza "Default pack is not registered" (rompe el SSR) en cualquier pagina
    // que use nb-icon, como el dashboard, ordenes o esta landing.
    importProvidersFrom(NbEvaIconsModule),
    importProvidersFrom(NbToastrModule.forRoot()),
    importProvidersFrom(NbDialogModule.forRoot()),
    importProvidersFrom(NbDatepickerModule.forRoot()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    {
      provide: NbOverlayContainerAdapter,
      useClass: OverlayContainer
    },
    // Ademas del <title>, setea meta description/Open Graph/canonical por
    // ruta (ver route.data.description en app.routes.ts)
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
  ],
};
