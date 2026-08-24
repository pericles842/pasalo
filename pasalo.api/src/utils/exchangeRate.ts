import axios from 'axios';
import { RateModel } from '../app/models/rate.model';

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares';

export interface ExchangeRates {
    oficial: number | null;
    paralelo: number | null;
    fecha_oficial: string | null;
    fecha_paralelo: string | null;
}

/**
 * Tasa del dolar BCV (oficial) y paralelo, leida de la tabla `rates`.
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
        oficial: latest?.oficial ?? null,
        paralelo: latest?.paralelo ?? null,
        fecha_oficial: latest?.fecha_oficial ?? null,
        fecha_paralelo: latest?.fecha_paralelo ?? null
    };
}

/**
 * Pide la tasa fresca a dolarapi.com y la guarda como una fila nueva en `rates`.
 * Es la unica funcion que le habla a la API externa; la ejecuta el endpoint
 * de sync, no las rutas que la app usa para leer la tasa.
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

    const oficial = data.find((d: any) => d.fuente === 'oficial');
    const paralelo = data.find((d: any) => d.fuente === 'paralelo');

    const rates: ExchangeRates = {
        oficial: oficial?.promedio ?? null,
        paralelo: paralelo?.promedio ?? null,
        fecha_oficial: oficial?.fechaActualizacion ?? null,
        fecha_paralelo: paralelo?.fechaActualizacion ?? null
    };

    await RateModel.create({ ...rates, source: 'dolarapi' });

    return rates;
}
