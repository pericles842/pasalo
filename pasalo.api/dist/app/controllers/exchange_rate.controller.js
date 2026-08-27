"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateController = void 0;
const exchangeRate_1 = require("../../utils/exchangeRate");
class ExchangeRateController {
    /**
     * Tasa del dólar BCV (oficial) y paralelo, leida de la base de datos.
     * Es publica: la usa tanto el dashboard como la pantalla de pago del cliente.
     * Nunca golpea la API externa, por lo que nunca depende de que esta responda.
     *
     * @static
     * @memberof ExchangeRateController
     */
    static async getRates(req, res, next) {
        try {
            res.json(await (0, exchangeRate_1.getExchangeRates)());
        }
        catch (err) {
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
    static async sync(req, res, next) {
        try {
            const rates = await (0, exchangeRate_1.syncExchangeRates)();
            res.json({ message: 'Tasa actualizada', rates });
        }
        catch (err) {
            res.status(502).json({
                message: 'No se pudo actualizar la tasa',
                error: 'dolarapi.com no respondió. Se mantiene la última tasa guardada.'
            });
        }
    }
}
exports.ExchangeRateController = ExchangeRateController;
