import { NextFunction, Request, Response } from 'express';
import { getExchangeRates, syncExchangeRates } from '../../utils/exchangeRate';

export class ExchangeRateController {

    /**
     * Tasas BCV, EUR y su promedio, leidas de la base de datos.
     * Es publica: la usa tanto el dashboard como la pantalla de pago del cliente.
     * Nunca golpea la API externa, por lo que nunca depende de que esta responda.
     *
     * @static
     * @memberof ExchangeRateController
     */
    static async getRates(req: Request, res: Response, next: NextFunction) {
        try {
            res.json(await getExchangeRates());
        } catch (err) {
            next(err);
        }
    }

    /**
     * Actualiza la tasa guardada pidiendola a dolarapi.com. Pensado para que lo
     * dispare un demonio externo cada cierto tiempo, no el frontend.
     *
     * Si dolarapi.com falla, no se toca la tabla `rates`: el sistema sigue
     * sirviendo la ultima tasa conocida en vez de quedar sin datos.
     *
     * @static
     * @memberof ExchangeRateController
     */
    static async sync(req: Request, res: Response, next: NextFunction) {
        try {
            const rates = await syncExchangeRates();
            res.json({ message: 'Tasa actualizada', rates });
        } catch (err) {
            res.status(502).json({
                message: 'No se pudo actualizar la tasa',
                error: 'dolarapi.com no respondió. Se mantiene la última tasa guardada.'
            });
        }
    }
}
