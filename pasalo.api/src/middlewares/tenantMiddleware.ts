import { NextFunction, Request, Response } from 'express';
import { getTenantConnection } from '../app/config/tenant';
import { SessionPayload } from './jwtMiddleware';

/**
 * Resuelve la conexion a la base de datos de la empresa del usuario logueado
 * y la deja disponible en req.tenantDb. Debe ir despues de jwtMiddleware.
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const session = (req as any).session as SessionPayload;
        (req as any).tenantDb = await getTenantConnection(session.company.tenant_id);
        next();
    } catch (err) {
        next(err);
    }
}
