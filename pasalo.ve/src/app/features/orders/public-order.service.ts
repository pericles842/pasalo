import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PublicBuyerPayload, PublicOrderSummary, SubmitPaymentResponse } from './interfaces/order';

/** Consumido desde la pantalla publica de pago (sin sesión) */
@Injectable({ providedIn: 'root' })
export class PublicOrderService {

  private http = inject(HttpClient);

  getSummary(tenant_id: string, token: string): Observable<PublicOrderSummary> {
    return this.http.get<PublicOrderSummary>(`${environment.host}/public/orders/${tenant_id}/${token}`);
  }

  /** Paso 1 del link publico: el cliente llena sus propios datos */
  submitBuyerData(tenant_id: string, token: string, buyer: PublicBuyerPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.host}/public/orders/${tenant_id}/${token}/buyer`, buyer);
  }

  submitPayment(tenant_id: string, token: string, payment_method_id: number, receipt: File): Observable<SubmitPaymentResponse> {
    const form = new FormData();
    form.append('payment_method_id', String(payment_method_id));
    form.append('receipt', receipt);

    return this.http.post<SubmitPaymentResponse>(`${environment.host}/public/orders/${tenant_id}/${token}/pay`, form);
  }
}
