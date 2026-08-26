import { Component, Input, inject } from '@angular/core';
import { NbButtonModule, NbDialogRef, NbIconModule } from '@nebular/theme';
import { AdInterface, AdsService } from '@shared/services/ads.service';

/**
 * Popup de publicidad (placement 'modal'). El Dashboard lo dispara cada
 * `ad.interval_seconds` (configurado por anuncio en la tabla `ads`); la foto
 * y el anuncio ganador ya vienen sorteados al azar desde el backend.
 */
@Component({
  selector: 'app-ad-modal',
  standalone: true,
  imports: [NbButtonModule, NbIconModule],
  templateUrl: './ad-modal.html',
})
export class AdModal {
  @Input({ required: true }) ad!: AdInterface;

  private adsService = inject(AdsService);

  constructor(protected dialogRef: NbDialogRef<AdModal>) { }

  onClick(): void {
    this.adsService.registerClick(this.ad.id);
  }

  close(): void {
    this.dialogRef.close();
  }
}
