import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { AdPlacement, AdPlanInterface, AdsService } from '@shared/services/ads.service';

/** Mismo numero de contacto que ya usa el resto de la app (footer, cambio de plan) */
const WHATSAPP_NUMBER = '584124971066';

const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  header: 'Header del dashboard',
  footer: 'Footer',
  sidebar: 'Sidebar y login',
  dashboard_static: 'Dashboard',
  modal: 'Modal (próximamente)',
};

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

  placementLabel(placement: AdPlacement): string {
    return PLACEMENT_LABELS[placement] ?? placement;
  }

  /** Mismo proceso que contratar una suscripcion: abre WhatsApp con el plan ya armado */
  contactWhatsApp(plan: AdPlanInterface): void {
    const message =
      `Hola, quiero contratar el plan de publicidad "${plan.name}" (${this.placementLabel(plan.placement)}) ` +
      `por $${plan.price} / ${plan.duration_days} días.`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  }
}
