import { NextFunction, Request, Response } from 'express';
import axios from 'axios';

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos: la tasa no cambia tan seguido

interface ExchangeRates {
    oficial: number | null;
    paralelo: number | null;
    fecha_oficial: string | null;
    fecha_paralelo: string | null;
}

let cache: { data: ExchangeRates; fetchedAt: number } | null = null;

async function fetchRates(): Promise<ExchangeRates> {
    const { data } = await axios.get(DOLAR_API_URL, { timeout: 5000 });

    const oficial = data.find((d: any) => d.fuente === 'oficial');
    const paralelo = data.find((d: any) => d.fuente === 'paralelo');

    return {
        oficial: oficial?.promedio ?? null,
        paralelo: paralelo?.promedio ?? null,
        fecha_oficial: oficial?.fechaActualizacion ?? null,
        fecha_paralelo: paralelo?.fechaActualizacion ?? null
    };
}

export class ExchangeRateController {

    /**
     * Tasa del dólar BCV (oficial) y paralelo, cacheada 30 minutos.
     * Es publica: la usa tanto el dashboard como la pantalla de pago del cliente.
     *
     * @static
     * @memberof ExchangeRateController
     */
    static async getRates(req: Request, res: Response, next: NextFunction) {
        try {
            const isStale = !cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS;

            if (isStale) {
                try {
                    const data = await fetchRates();
                    cache = { data, fetchedAt: Date.now() };
                } catch (err) {
                    // Si dolarapi falla y tenemos un valor previo, seguimos sirviendo ese
                    // en vez de tumbar la pantalla de pago por una tasa
                    if (!cache) throw err;
                }
            }

            res.json(cache!.data);
        } catch (err) {
            next(err);
        }
    }
}
