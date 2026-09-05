import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { QueryTypes, Sequelize } from 'sequelize';
import { SessionPayload } from '../../middlewares/jwtMiddleware';
import { hashEndpoint } from '../../utils/webPush';

export class PushSubscriptionController {

    private static session(req: Request): SessionPayload {
        return (req as any).session as SessionPayload;
    }

    private static tenantDb(req: Request): Sequelize {
        return (req as any).tenantDb as Sequelize;
    }

    /**
     * Guarda (o actualiza) la suscripcion push del navegador actual.
     * body: { endpoint, keys: { p256dh, auth } } — el shape nativo de
     * PushSubscription.toJSON() del navegador.
     *
     * Upsert por endpoint_hash: si el navegador rota el endpoint al
     * resuscribirse, evita filas duplicadas para el mismo dispositivo.
     */
    static async subscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const session = PushSubscriptionController.session(req);
            const tenantDb = PushSubscriptionController.tenantDb(req);
            const { endpoint, keys } = req.body ?? {};

            if (!endpoint || !keys?.p256dh || !keys?.auth) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Falta endpoint o las llaves de la suscripción.' });
                return;
            }

            const endpoint_hash = hashEndpoint(endpoint);
            const user_agent = req.headers['user-agent'] ?? null;

            const [existing] = await tenantDb.query<any>(
                `SELECT id FROM push_subscriptions WHERE endpoint_hash = :endpoint_hash`,
                { replacements: { endpoint_hash }, type: QueryTypes.SELECT }
            );

            if (existing) {
                await tenantDb.query(
                    `UPDATE push_subscriptions
                     SET user_id = :user_id, p256dh = :p256dh, auth = :auth, user_agent = :user_agent, updatedAt = NOW()
                     WHERE id = :id`,
                    { replacements: { id: existing.id, user_id: session.user.uuid, p256dh: keys.p256dh, auth: keys.auth, user_agent } }
                );
            } else {
                await tenantDb.getQueryInterface().bulkInsert('push_subscriptions', [{
                    id: randomUUID(),
                    user_id: session.user.uuid,
                    endpoint,
                    endpoint_hash,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    user_agent,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }]);
            }

            res.status(201).json({ message: 'Suscripción guardada' });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Elimina la suscripcion del navegador actual (se llama al desactivar
     * las notificaciones desde la UI).
     * body: { endpoint }
     */
    static async unsubscribe(req: Request, res: Response, next: NextFunction) {
        try {
            const tenantDb = PushSubscriptionController.tenantDb(req);
            const { endpoint } = req.body ?? {};

            if (!endpoint) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Falta endpoint.' });
                return;
            }

            await tenantDb.query(`DELETE FROM push_subscriptions WHERE endpoint_hash = :endpoint_hash`, {
                replacements: { endpoint_hash: hashEndpoint(endpoint) },
            });

            res.json({ message: 'Suscripción eliminada' });
        } catch (err) {
            next(err);
        }
    }
}
