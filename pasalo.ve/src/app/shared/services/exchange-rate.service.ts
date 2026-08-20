import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { environment } from 'src/environments/environment';

interface ExchangeRatesResponse {
  oficial: number | null;
  paralelo: number | null;
  fecha_oficial: string | null;
  fecha_paralelo: string | null;
}

/**
 * Tasa del dólar BCV (oficial) y paralelo. Se pide una sola vez por sesión
 * de navegador y queda disponible como signal para toda la app: ningun
 * componente necesita pedirla ni cachearla por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class ExchangeRateService {

  private http = inject(HttpClient);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private requested = false;

  rateOficial = signal<number | null>(null);
  rateParalelo = signal<number | null>(null);
  updatedAt = signal<string | null>(null);

  constructor() {
    if (this.is_browser) this.load();
  }

  private load(): void {
    if (this.requested) return;
    this.requested = true;

    this.http.get<ExchangeRatesResponse>(`${environment.host}/exchange-rate`).subscribe({
      next: (rates) => {
        this.rateOficial.set(rates.oficial);
        this.rateParalelo.set(rates.paralelo);
        this.updatedAt.set(rates.fecha_oficial);
      },
      // Si dolarapi falla, los montos simplemente se muestran solo en USD
      error: () => { }
    });
  }
}
