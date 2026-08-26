import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { AdPlanInterface, AdsService } from '@shared/services/ads.service';

/** Mismo numero de contacto que ya usa el resto de la app (footer, cambio de plan) */
const WHATSAPP_NUMBER = '584124971066';

@Component({
  selector: 'app-ads',
  imports: [NbCardModule, NbButtonModule],
  templateUrl: './ads.html',
})
export class Ads implements OnInit {

  private adsService = inject(AdsService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  plans = signal<AdPlanInterface[]>([]);
  is_loading = signal(true);

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.adsService.getPlans().subscribe((plans) => {
      this.plans.set(plans);
      this.is_loading.set(false);
    });
  }

  /** Nombre de cada ubicacion viene directo de `ad_locations`: agregar una nueva no requiere tocar este archivo */
  locationsLabel(plan: AdPlanInterface): string {
    return plan.locations.map((location) => location.name).join(' + ');
  }

  /** Mismo proceso que contratar una suscripcion: abre WhatsApp con el plan ya armado */
  contactWhatsApp(plan: AdPlanInterface): void {
    const message =
      `Hola, quiero contratar el plan de publicidad "${plan.name}" (${this.locationsLabel(plan)}) ` +
      `por $${plan.price} / ${plan.duration_days} días.`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  }
}
