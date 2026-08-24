import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { NbButtonModule } from '@nebular/theme';
import { AuthService } from 'src/app/features/auth/auth.service';
import { SubscriptionService } from 'src/app/features/company/subscription.service';
import { SubscriptionStatus } from 'src/app/features/company/interfaces/subscription';

/** id del status "Pendiente de verificación" en status_subscriptions */
const PENDING_VERIFICATION_STATUS_ID = 4;
/** A partir de cuantos dias restantes se muestra la alerta de "por vencer" */
const EXPIRING_SOON_THRESHOLD_DAYS = 5;
const WHATSAPP_NUMBER = '584124971066';

/**
 * Banner persistente del dashboard con el estado de la suscripcion:
 * pendiente de verificacion, activa (con fecha de vencimiento), o por vencer.
 * No muestra nada si el plan es gratuito y no hay nada pendiente.
 */
@Component({
  selector: 'app-subscription-status-banner',
  standalone: true,
  imports: [NbButtonModule, DatePipe],
  templateUrl: './subscription-status-banner.html',
})
export class SubscriptionStatusBanner implements OnInit {

  private subscriptionService = inject(SubscriptionService);
  private auth = inject(AuthService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  status = signal<SubscriptionStatus | null>(null);

  is_pending = computed(() => this.status()?.status_id === PENDING_VERIFICATION_STATUS_ID);

  is_expiring_soon = computed(() => {
    const days = this.status()?.days_remaining;
    return days !== null && days !== undefined && days <= EXPIRING_SOON_THRESHOLD_DAYS;
  });

  whatsapp_url = computed(() => {
    const pending_plan = this.status()?.pending_plan;
    if (!pending_plan) return '';

    const company_name = this.auth.session()?.company?.name ?? 'mi empresa';
    const message = `Hola, quiero confirmar el estado de mi pago del ${pending_plan.name} para mi empresa ${company_name}.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  });

  ngOnInit(): void {
    if (!this.is_browser) return;

    this.subscriptionService.getStatus().subscribe({
      next: (status) => this.status.set(status),
      // Si falla, simplemente no se muestra el banner: no es critico para el resto del dashboard
      error: () => { }
    });
  }
}
