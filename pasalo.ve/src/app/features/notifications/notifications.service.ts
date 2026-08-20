import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppNotification } from './interfaces/notification';

export interface NotificationFilters {
  limit?: number;
  seller_id?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {

  private http = inject(HttpClient);

  /**
   * El backend ya restringe por rol: el vendedor solo ve las suyas,
   * el admin ve todas y puede filtrar por vendedor.
   *
   * @param {NotificationFilters} [filters]
   * @memberof NotificationsService
   */
  getNotifications(filters?: NotificationFilters): Observable<AppNotification[]> {
    let params = new HttpParams();
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.seller_id) params = params.set('seller_id', filters.seller_id);

    return this.http.get<AppNotification[]>(`${environment.host}/notifications`, { params });
  }
}
