"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalTokenMiddleware = internalTokenMiddleware;
const crypto_1 = require("crypto");
/**
 * Protege endpoints internos (ej. el sync de tasas) que no tienen sesión de
 * usuario: los llama un proceso externo (demonio/cron), no el frontend.
 * Se autentica con un token compartido en el header `x-sync-token`, comparado
 * contra RATES_SYNC_TOKEN del .env.
 */
function internalTokenMiddleware(req, res, next) {
    const expected = process.env.RATES_SYNC_TOKEN;
    if (!expected) {
        res.status(500).json({ message: 'Configuración incompleta', error: 'RATES_SYNC_TOKEN no está definido en el servidor.' });
        return;
    }
    const received = req.headers['x-sync-token'];
    if (typeof received !== 'string' || received.length !== expected.length
        || !(0, crypto_1.timingSafeEqual)(Buffer.from(received), Buffer.from(expected))) {
        res.status(401).json({ message: 'No autorizado', error: 'Token de sincronización inválido.' });
        return;
    }
    next();
}
