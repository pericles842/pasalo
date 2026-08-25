import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';

export type AdPlacement = 'header' | 'footer' | 'sidebar' | 'dashboard_static' | 'modal';

export interface AdInterface {
  id: number;
  company_name: string;
  target_url: string;
  placement: AdPlacement;
  image_url: string;
  interval_seconds: number | null;
}

export interface AdPlanInterface {
  id: number;
  name: string;
  placement: AdPlacement;
  priority: number;
  price: number;
  duration_days: number;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdsService {

  private http = inject(HttpClient);

  /** Devuelve el anuncio sorteado para ese placement, o null si no hay ninguno activo */
  getAd(placement: AdPlacement): Observable<AdInterface | null> {
    return this.http.get<AdInterface>(`${environment.host}/ads/${placement}`).pipe(
      catchError(() => of(null)),
    );
  }

  registerClick(adId: number): void {
    this.http.post(`${environment.host}/ads/${adId}/click`, {}).pipe(
      catchError(() => of(null)),
    ).subscribe();
  }

  getPlans(): Observable<AdPlanInterface[]> {
    return this.http.get<AdPlanInterface[]>(`${environment.host}/ads/plans`).pipe(
      catchError(() => of([])),
    );
  }
}
