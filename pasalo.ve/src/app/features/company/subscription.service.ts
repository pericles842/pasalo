import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChangePlanPendingResponse, ChangePlanResult, SubscriptionStatus } from './interfaces/subscription';
import { BillingCycle, annualPrice } from '@shared/utils/billing';

/** Mismo número de contacto que ya se usa en el footer público */
const WHATSAPP_NUMBER = '584124971066';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

  private http = inject(HttpClient);

  getStatus(): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${environment.host}/company/subscription`);
  }

  /**
   * El plan gratuito se aplica al instante; un plan pago queda pendiente de
   * verificación (ver CompanyUserController.changePlan en el backend).
   */
  changePlan(plan_id: number): Observable<ChangePlanResult> {
    return this.http.put<ChangePlanResult>(`${environment.host}/company/subscription`, { plan_id });
  }

  /**
   * Arma el link de WhatsApp con el precio ya calculado en USD y Bs.
   * El backend siempre devuelve el monto mensual: si el cliente eligió el
   * ciclo anual, acá se aplica el descuento del 20% y se escala el monto en Bs.
   */
  buildWhatsAppUrl(
    company_name: string,
    response: ChangePlanPendingResponse,
    cycle: BillingCycle = 'monthly',
  ): string {
    const is_annual = cycle === 'annual';
    const amount_usd = is_annual ? annualPrice(response.amount_usd) : response.amount_usd;
    const factor = response.amount_usd ? amount_usd / response.amount_usd : 1;
    const amount_bs = response.amount_bs !== null ? Math.round(response.amount_bs * factor) : null;

    const bs = amount_bs !== null ? ` (Bs ${amount_bs.toLocaleString('es-VE')})` : '';
    const period = is_annual ? 'plan anual' : 'plan mensual';

    const message =
      `Hola, quiero el ${response.plan.name} (${period}) para mi empresa ${company_name}. ` +
      `Monto: $${amount_usd}${bs}. Quedo atento a los datos del pago móvil.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}
