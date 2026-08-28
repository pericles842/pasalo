import { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Protege endpoints internos (ej. el sync de tasas) que no tienen sesión de
 * usuario: los llama un proceso externo (demonio/cron), no el frontend.
 * Se autentica con un token compartido en el query param `token`, comparado
 * contra RATES_SYNC_TOKEN del .env.
 */
export function internalTokenMiddleware(req: Request, res: Response, next: NextFunction) {
    const expected = process.env.RATES_SYNC_TOKEN;

    if (!expected) {
        res.status(500).json({ message: 'Configuración incompleta', error: 'RATES_SYNC_TOKEN no está definido en el servidor.' });
        return;
    }

    const received = req.query.token;

    if (typeof received !== 'string' || received.length !== expected.length
        || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
        res.status(401).json({ message: 'No autorizado', error: 'Token de sincronización inválido.' });
        return;
    }

    next();
}
