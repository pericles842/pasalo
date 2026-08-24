import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChangePlanPendingResponse, ChangePlanResult, SubscriptionStatus } from './interfaces/subscription';

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

  /** Arma el link de WhatsApp con el precio ya calculado en USD y Bs */
  buildWhatsAppUrl(company_name: string, response: ChangePlanPendingResponse): string {
    const bs = response.amount_bs !== null ? ` (Bs ${response.amount_bs.toLocaleString('es-VE')})` : '';

    const message =
      `Hola, quiero el ${response.plan.name} para mi empresa ${company_name}. ` +
      `Monto: $${response.amount_usd}${bs}. Quedo atento a los datos del pago móvil.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}
