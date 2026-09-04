import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { AdPlanInterface, AdsService } from '@shared/services/ads.service';
import { BillingCycleToggle } from '@shared/components/billing-cycle-toggle/billing-cycle-toggle';
import { BillingCycle, annualPrice, annualSavings } from '@shared/utils/billing';

/** Mismo numero de contacto que ya usa el resto de la app (footer, cambio de plan) */
const WHATSAPP_NUMBER = '584124971066';

@Component({
  selector: 'app-ads',
  imports: [NbCardModule, NbButtonModule, BillingCycleToggle],
  templateUrl: './ads.html',
})
export class Ads implements OnInit {

  private adsService = inject(AdsService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  plans = signal<AdPlanInterface[]>([]);
  billing_cycle = signal<BillingCycle>('monthly');
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

  /** El precio de lista es por periodo de 30 dias; el anual aplica el 20% de descuento sobre 12 periodos */
  adPrice(plan: AdPlanInterface): number {
    return this.billing_cycle() === 'annual' ? annualPrice(plan.price) : plan.price;
  }

  adPeriodLabel(plan: AdPlanInterface): string {
    return this.billing_cycle() === 'annual' ? 'año' : `${plan.duration_days} días`;
  }

  adSavings(plan: AdPlanInterface): number {
    return annualSavings(plan.price);
  }

  /** Mismo proceso que contratar una suscripcion: abre WhatsApp con el plan ya armado */
  contactWhatsApp(plan: AdPlanInterface): void {
    const period = this.billing_cycle() === 'annual' ? '1 año' : `${plan.duration_days} días`;
    const message =
      `Hola, quiero contratar el plan de publicidad "${plan.name}" (${this.locationsLabel(plan)}) ` +
      `por $${this.adPrice(plan)} / ${period}.`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  }
}
