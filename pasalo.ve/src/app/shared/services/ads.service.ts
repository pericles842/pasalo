import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * `target_url` se carga a mano en la base (ver ADS_CONTEXT.md): si a alguien
 * se le olvida el protocolo (ej. "coffeecode.es"), un <a href> lo trata como
 * ruta relativa de Pásalo en vez de un link externo. Se normaliza siempre acá,
 * un solo lugar, para que ningun componente tenga que acordarse de hacerlo.
 */
function normalizeExternalUrl(url: string): string {
  return /^(https?:)?\/\//i.test(url) ? url : `https://${url}`;
}

/** Clave libre, no un enum fijo: coincide con `ad_locations.key` (ej. "header-dashboard", "modal") */
export type AdPlacement = string;

export interface AdLocationInterface {
  id: number;
  key: AdPlacement;
  name: string;
}

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
  priority: number;
  price: number;
  duration_days: number;
  description: string | null;
  locations: AdLocationInterface[];
}

@Injectable({ providedIn: 'root' })
export class AdsService {

  private http = inject(HttpClient);

  /** Devuelve el anuncio sorteado para ese placement, o null si no hay ninguno activo */
  getAd(placement: AdPlacement): Observable<AdInterface | null> {
    return this.http.get<AdInterface>(`${environment.host}/ads/${placement}`).pipe(
      map((ad) => ({ ...ad, target_url: normalizeExternalUrl(ad.target_url) })),
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
