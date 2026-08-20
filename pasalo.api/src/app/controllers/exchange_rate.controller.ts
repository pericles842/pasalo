import { NextFunction, Request, Response } from 'express';
import { getExchangeRates } from '../../utils/exchangeRate';

export class ExchangeRateController {

    /**
     * Tasa del dólar BCV (oficial) y paralelo.
     * Es publica: la usa tanto el dashboard como la pantalla de pago del cliente.
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
}
