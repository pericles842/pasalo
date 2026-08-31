import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { AdModal } from '@shared/components/ad-modal/ad-modal';
import { AdPlacement, AdsService } from './ads.service';
import { OnboardingService } from './onboarding.service';

/** Si el anuncio no trae `interval_seconds` propio, se reintenta cada 15 min */
const DEFAULT_INTERVAL_SECONDS = 15 * 60;

/**
 * Ciclo de sorteo/popup de un anuncio 'modal': lo usan tanto el dashboard
 * (`layout/dashboard`) como el sitio publico (`layout/web-client`), cada uno
 * arrancandolo en su propio `ngOnInit` y frenandolo en `ngOnDestroy` — nunca
 * corren los dos a la vez porque sus rutas son mutuamente excluyentes.
 */
@Injectable({ providedIn: 'root' })
export class ModalAdService {

  private dialogService = inject(NbDialogService);
  private adsService = inject(AdsService);
  private onboarding = inject(OnboardingService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private timer: ReturnType<typeof setTimeout> | null = null;
  private dialog_ref: NbDialogRef<AdModal> | null = null;
  private placement: AdPlacement = 'modal';

  constructor() {
    // Si el tutorial arranca con un anuncio ya abierto, se lo cierra: el paso a
    // paso no puede quedar tapado por publicidad.
    effect(() => {
      if (this.onboarding.is_running()) this.dialog_ref?.close();
    });
  }

  start(placement: AdPlacement, initialDelayMs: number): void {
    if (!this.is_browser || this.timer) return;

    this.placement = placement;
    this.schedule(initialDelayMs);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(delayMs: number): void {
    this.timer = setTimeout(() => this.show(), delayMs);
  }

  private show(): void {
    // Ya hay uno abierto (el usuario no lo cerro todavia), o el tutorial guiado
    // esta en pantalla: no se le monta nada encima, se reintenta mas tarde.
    if (this.dialog_ref || this.onboarding.is_running()) {
      this.schedule(DEFAULT_INTERVAL_SECONDS * 1000);
      return;
    }

    this.adsService.getAd(this.placement).subscribe((ad) => {
      // El tutorial pudo arrancar mientras el pedido estaba en vuelo
      if (!ad || this.onboarding.is_running()) {
        this.schedule(DEFAULT_INTERVAL_SECONDS * 1000);
        return;
      }

      this.dialog_ref = this.dialogService.open(AdModal, { context: { ad }, closeOnBackdropClick: true });

      // El proximo intento se agenda recien cuando este se cierra, no antes:
      // asi el intervalo del anuncio corre entre popups, no entre aperturas.
      this.dialog_ref.onClose.subscribe(() => {
        this.dialog_ref = null;
        this.schedule((ad.interval_seconds ?? DEFAULT_INTERVAL_SECONDS) * 1000);
      });
    });
  }
}
