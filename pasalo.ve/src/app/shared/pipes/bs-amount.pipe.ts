import { Pipe, PipeTransform } from '@angular/core';
import { toBs } from '../utils/currency';

/**
 * Muestra un monto en dolares convertido a bolivares.
 * El segundo argumento es la tasa (leela de ExchangeRateService.rateOficial()
 * directamente en la plantilla, para que el pipe reaccione cuando llegue).
 *
 * Uso: {{ order.amount | bsAmount: exchangeRate.rateOficial() }}
 */
@Pipe({ name: 'bsAmount' })
export class BsAmountPipe implements PipeTransform {
  transform(amountUsd: number | null | undefined, rate: number | null | undefined): string | null {
    const bs = toBs(amountUsd, rate);
    if (bs === null) return null;

    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bs);
  }
}
