import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AdInterface, AdPlacement, AdsService } from '@shared/services/ads.service';

/**
 * Slot de publicidad reutilizable: pide un anuncio para `placement` y lo muestra,
 * o cae en una caja placeholder ("Aquí va tu publicidad") si no hay ninguno activo.
 * Siempre lleva debajo un link chiquito a /publicidad, haya o no anuncio activo.
 * El tamaño lo define quien lo usa (el host llena el contenedor con h-full w-full).
 */
@Component({
  selector: 'app-ad-slot',
  templateUrl: './ad-slot.html',
  imports: [NbIconModule, NbEvaIconsModule, RouterLink],
  host: { class: 'block h-full w-full' },
})
export class AdSlot implements OnInit {
  @Input({ required: true }) placement!: AdPlacement;

  private adsService = inject(AdsService);

  ad = signal<AdInterface | null>(null);

  ngOnInit(): void {
    this.adsService.getAd(this.placement).subscribe((ad) => this.ad.set(ad));
  }

  onClick(adId: number): void {
    this.adsService.registerClick(adId);
  }
}
