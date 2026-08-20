import axios from 'axios';

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos: la tasa no cambia tan seguido

export interface ExchangeRates {
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

/**
 * Tasa del dólar BCV (oficial) y paralelo, cacheada 30 minutos.
 * Compartida entre el endpoint publico y la deteccion de pagos sospechosos,
 * asi solo se golpea dolarapi una vez para toda la app.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
    const isStale = !cache || Date.now() - cache.fetchedAt > CACHE_TTL_MS;

    if (isStale) {
        try {
            const data = await fetchRates();
            cache = { data, fetchedAt: Date.now() };
        } catch (err) {
            // Si dolarapi falla y tenemos un valor previo, seguimos sirviendo ese
            if (!cache) throw err;
        }
    }

    return cache!.data;
}
