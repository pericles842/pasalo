import axios from 'axios';
import { RateModel } from '../app/models/rate.model';

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/cotizaciones';

export type RateType = 'bcv' | 'eur' | 'promedio';

export interface ExchangeRates {
    bcv: number | null;
    eur: number | null;
    promedio: number | null;
    fecha: string | null;
}

/**
 * Tasas BCV, EUR y su promedio, leidas de la tabla `rates`.
 * No golpea ninguna API externa: la app entera lee de aqui, asi que si
 * dolarapi.com se cae o se pone lento, no afecta ni el rendimiento ni la
 * disponibilidad del sistema. La tabla la actualiza el sync (ver abajo),
 * disparado por un proceso externo, no por este request.
 *
 * @export
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
    const latest = await RateModel.findOne({ order: [['id', 'DESC']] });

    return {
        bcv: latest?.bcv ?? null,
        eur: latest?.eur ?? null,
        promedio: latest?.promedio ?? null,
        fecha: latest?.fecha ?? null
    };
}

/**
 * Pide las tasas frescas a dolarapi.com y las guarda como una fila nueva en
 * `rates`. Es la unica funcion que le habla a la API externa; la ejecuta el
 * endpoint de sync, no las rutas que la app usa para leer la tasa.
 *
 * Si dolarapi.com falla, esto lanza el error y listo: no se toca la tabla,
 * por lo que getExchangeRates() sigue sirviendo la ultima tasa buena conocida.
 * Preferimos datos desactualizados a que el sistema dependa de que un
 * tercero este arriba.
 *
 * @export
 */
export async function syncExchangeRates(): Promise<ExchangeRates> {
    const { data } = await axios.get(DOLAR_API_URL, { timeout: 5000 });

    const usd = data.find((d: any) => d.moneda === 'USD');
    const eurRow = data.find((d: any) => d.moneda === 'EUR');

    const bcv = usd?.promedio ?? null;
    const eur = eurRow?.promedio ?? null;
    const promedio = bcv !== null && eur !== null ? (bcv + eur) / 2 : null;

    const rates: ExchangeRates = {
        bcv,
        eur,
        promedio,
        fecha: usd?.fechaActualizacion ?? eurRow?.fechaActualizacion ?? null
    };

    await RateModel.create({ ...rates, source: 'dolarapi' });

    return rates;
}
