import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreateOrderPayload, CreateOrderResponse, Order, OrderDetail, OrderStatus } from './interfaces/order';

export interface OrderFilters {
  seller_id?: string | null;
  status_id?: number | null;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OrderStats {
  total_ventas: number;
  total_clientes: number;
  total_ordenes: number;
  total_rechazadas: number;
  total_completadas: number;
  total_vendedores_completadas: number;
  payment_methods_count: number;
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
  getOrders(filters?: OrderFilters): Observable<PaginatedOrders> {
    let params = new HttpParams();
    if (filters?.seller_id) params = params.set('seller_id', filters.seller_id);
    if (filters?.status_id) params = params.set('status_id', filters.status_id);
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);

    return this.http.get<PaginatedOrders>(`${environment.host}/orders`, { params });
  }

  getStatuses(): Observable<OrderStatus[]> {
    return this.http.get<OrderStatus[]>(`${environment.host}/order-statuses`);
  }

  /** Tarjetas informativas del admin. Sin fechas, trae el historico completo. */
  getStats(date_from?: string | null, date_to?: string | null): Observable<OrderStats> {
    let params = new HttpParams();
    if (date_from) params = params.set('date_from', date_from);
    if (date_to) params = params.set('date_to', date_to);

    return this.http.get<OrderStats>(`${environment.host}/orders/stats`, { params });
  }

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${environment.host}/orders`, payload);
  }

  updateStatus(order_id: string, status_id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.host}/orders/${order_id}/status`, { status_id });
  }

  getOrderById(id: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${environment.host}/orders/${id}`);
  }
}
