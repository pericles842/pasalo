import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreateOrderPayload, CreateOrderResponse, Order, OrderStatus } from './interfaces/order';

export interface OrderFilters {
  seller_id?: string | null;
  status_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {

  private http = inject(HttpClient);

  /**
   * Lista las ordenes. El backend ya restringe por rol:
   * el vendedor solo ve las suyas, el admin puede filtrar por vendedor y estado.
   *
   * @param {OrderFilters} [filters]
   * @memberof OrdersService
   */
  getOrders(filters?: OrderFilters): Observable<Order[]> {
    let params = new HttpParams();
    if (filters?.seller_id) params = params.set('seller_id', filters.seller_id);
    if (filters?.status_id) params = params.set('status_id', filters.status_id);

    return this.http.get<Order[]>(`${environment.host}/orders`, { params });
  }

  getStatuses(): Observable<OrderStatus[]> {
    return this.http.get<OrderStatus[]>(`${environment.host}/order-statuses`);
  }

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${environment.host}/orders`, payload);
  }

  updateStatus(order_id: string, status_id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.host}/orders/${order_id}/status`, { status_id });
  }
}
