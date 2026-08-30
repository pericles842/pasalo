import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreatePaymentMethodPayload,
  CreatePaymentMethodResponse,
  DeletePaymentMethodResponse,
  PaymentMethod,
  PaymentMethodsListResponse,
} from './interfaces/payment-method';

@Injectable({ providedIn: 'root' })
export class PaymentMethodsService {

  private http = inject(HttpClient);

  getPaymentMethods(): Observable<PaymentMethodsListResponse> {
    return this.http.get<PaymentMethodsListResponse>(`${environment.host}/company/payment-methods`);
  }

  createPaymentMethod(payload: CreatePaymentMethodPayload): Observable<CreatePaymentMethodResponse> {
    return this.http.post<CreatePaymentMethodResponse>(`${environment.host}/company/payment-methods`, payload);
  }

  updatePaymentMethod(id: number, payload: CreatePaymentMethodPayload): Observable<{ method: PaymentMethod }> {
    return this.http.put<{ method: PaymentMethod }>(`${environment.host}/company/payment-methods/${id}`, payload);
  }

  deletePaymentMethod(id: number): Observable<DeletePaymentMethodResponse> {
    return this.http.delete<DeletePaymentMethodResponse>(`${environment.host}/company/payment-methods/${id}`);
  }
}
