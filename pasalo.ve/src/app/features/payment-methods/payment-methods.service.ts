import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreatePaymentMethodPayload, PaymentMethod } from './interfaces/payment-method';

@Injectable({ providedIn: 'root' })
export class PaymentMethodsService {

  private http = inject(HttpClient);

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${environment.host}/company/payment-methods`);
  }

  createPaymentMethod(payload: CreatePaymentMethodPayload): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${environment.host}/company/payment-methods`, payload);
  }

  deletePaymentMethod(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.host}/company/payment-methods/${id}`);
  }
}
