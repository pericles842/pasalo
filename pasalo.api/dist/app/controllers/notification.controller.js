"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
class NotificationController {
    static session(req) {
        return req.session;
    }
    static tenantDb(req) {
        return req.tenantDb;
    }
    /**
     * Notificaciones de pago. El vendedor solo ve las suyas; el administrador
     * ve todas y puede filtrar por vendedor. Con ?limit se acota (el panel
     * de la campana pide las ultimas 5); sin limit, es el historial completo.
     *
     * @static
     * @memberof NotificationController
     */
    static async list(req, res, next) {
        try {
            const session = NotificationController.session(req);
            const tenantDb = NotificationController.tenantDb(req);
            const is_admin = session.role === 'admin';
            const where = [];
            const replacements = {};
            if (is_admin) {
                if (req.query.seller_id) {
                    where.push('n.seller_id = :seller_id');
                    replacements.seller_id = req.query.seller_id;
                }
            }
            else {
                where.push('n.seller_id = :seller_id');
                replacements.seller_id = session.user.uuid;
            }
            const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
            const limit = Math.min(Number(req.query.limit) || 100, 100);
            const notifications = await tenantDb.query(`SELECT n.*, o.pay_url_token
                 FROM notifications n
                 JOIN orders o ON o.id = n.order_id
                 ${whereClause}
                 ORDER BY n.createdAt DESC
                 LIMIT ${limit}`, { replacements, type: sequelize_1.QueryTypes.SELECT });
            // El admin ve notificaciones de varios vendedores: se resuelve el nombre
            // contra la base master, que es donde vive users
            if (is_admin && notifications.length) {
                const seller_ids = [...new Set(notifications.map((n) => n.seller_id))];
                const sellers = await db_1.sequelize.query(`SELECT uuid, first_name, middle_name FROM users WHERE uuid IN (:seller_ids)`, { replacements: { seller_ids }, type: sequelize_1.QueryTypes.SELECT });
                const sellerNames = new Map(sellers.map((s) => [s.uuid, `${s.first_name} ${s.middle_name ?? ''}`.trim()]));
                for (const n of notifications) {
                    n.seller_name = sellerNames.get(n.seller_id) ?? null;
                }
            }
            res.json(notifications);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Elimina una notificación puntual. El vendedor solo puede borrar las suyas;
     * el administrador puede borrar cualquiera de la empresa.
     *
     * @static
     * @memberof NotificationController
     */
    static async remove(req, res, next) {
        try {
            const session = NotificationController.session(req);
            const tenantDb = NotificationController.tenantDb(req);
            const is_admin = session.role === 'admin';
            const { id } = req.params;
            const where = is_admin ? 'id = :id' : 'id = :id AND seller_id = :seller_id';
            const [existing] = await tenantDb.query(`SELECT id FROM notifications WHERE ${where}`, {
                replacements: { id, seller_id: session.user.uuid },
                type: sequelize_1.QueryTypes.SELECT
            });
            if (!existing) {
                res.status(404).json({ message: 'Notificación no encontrada', error: 'Esa notificación no existe o no te pertenece.' });
                return;
            }
            await tenantDb.query(`DELETE FROM notifications WHERE id = :id`, { replacements: { id } });
            res.json({ message: 'Notificación eliminada' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Borra todas las notificaciones visibles para el usuario actual: el
     * vendedor limpia las suyas, el administrador limpia todas las de la empresa.
     *
     * @static
     * @memberof NotificationController
     */
    static async removeAll(req, res, next) {
        try {
            const session = NotificationController.session(req);
            const tenantDb = NotificationController.tenantDb(req);
            const is_admin = session.role === 'admin';
            const where = is_admin ? '' : 'WHERE seller_id = :seller_id';
            await tenantDb.query(`DELETE FROM notifications ${where}`, {
                replacements: { seller_id: session.user.uuid }
            });
            res.json({ message: 'Notificaciones eliminadas' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
