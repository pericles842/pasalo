import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/features/auth/auth.service';

interface ExchangeRatesResponse {
  bcv: number | null;
  eur: number | null;
  promedio: number | null;
  fecha: string | null;
}

/**
 * Tasas BCV, EUR y su promedio. Se piden una sola vez por sesion de
 * navegador y quedan disponibles como signals para toda la app: ningun
 * componente necesita pedirlas ni cachearlas por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class ExchangeRateService {

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private requested = false;

  rateBcv = signal<number | null>(null);
  rateEur = signal<number | null>(null);
  ratePromedio = signal<number | null>(null);
  updatedAt = signal<string | null>(null);

  /** La tasa segun la eleccion de la empresa logueada (bcv por defecto si no hay sesion) */
  activeRate = computed(() => {
    const rate_type = this.auth.session()?.company.default_rate_type ?? 'bcv';

    if (rate_type === 'eur') return this.rateEur();
    if (rate_type === 'promedio') return this.ratePromedio();
    return this.rateBcv();
  });

  constructor() {
    if (this.is_browser) this.load();
  }

  private load(): void {
    if (this.requested) return;
    this.requested = true;

    this.http.get<ExchangeRatesResponse>(`${environment.host}/exchange-rate`).subscribe({
      next: (rates) => {
        this.rateBcv.set(rates.bcv);
        this.rateEur.set(rates.eur);
        this.ratePromedio.set(rates.promedio);
        this.updatedAt.set(rates.fecha);
      },
      // Si dolarapi falla, los montos simplemente se muestran solo en USD
      error: () => { }
    });
  }
}
