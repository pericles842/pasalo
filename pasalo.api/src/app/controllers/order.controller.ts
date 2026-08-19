import { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { randomUUID } from 'crypto';
import { Sequelize } from 'sequelize';
import { SessionPayload } from '../../middlewares/jwtMiddleware';

export class OrderController {

    private static session(req: Request): SessionPayload {
        return (req as any).session as SessionPayload;
    }

    private static tenantDb(req: Request): Sequelize {
        return (req as any).tenantDb as Sequelize;
    }

    /**
     * Crea la orden (la venta) con sus renglones de productos.
     * Se asigna siempre al vendedor que la crea.
     *
     * @static
     * @memberof OrderController
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const { buyer, items, notes } = req.body;

            if (!buyer?.first_name || !buyer?.last_name || !buyer?.email || !buyer?.ci || !buyer?.phone || !buyer?.address) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Completa todos los datos del comprador.' });
                return;
            }

            if (!Array.isArray(items) || items.length === 0) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Agrega al menos un producto a la orden.' });
                return;
            }

            for (const item of items) {
                if (!item.name || item.price === undefined || item.price === null || Number(item.price) <= 0) {
                    res.status(400).json({ message: 'Producto inválido', error: 'Cada producto necesita un nombre y un precio mayor a 0.' });
                    return;
                }
            }

            const order_id = randomUUID();
            const pay_url_token = randomUUID();
            const amount = items.reduce((total: number, item: any) => total + Number(item.price), 0);

            await tenantDb.getQueryInterface().bulkInsert('orders', [{
                id: order_id,
                company_id: session.company.uuid,
                user_id: session.user.uuid,
                first_name_client: buyer.first_name,
                last_name_client: buyer.last_name,
                email_client: buyer.email,
                ci_client: buyer.ci,
                phone_client: buyer.phone,
                address_client: buyer.address,
                notes: notes ?? null,
                amount,
                status_id: 1,
                pay_url_token,
                createdAt: new Date(),
                updatedAt: new Date()
            }]);

            await tenantDb.getQueryInterface().bulkInsert('order_items', items.map((item: any) => ({
                id: randomUUID(),
                order_id,
                name: item.name,
                reference: item.reference ?? null,
                price: Number(item.price),
                createdAt: new Date(),
                updatedAt: new Date()
            })));

            const payUrlBase = process.env.PAYMENT_BASE_URL || 'http://localhost:4200/p';

            res.status(201).json({
                order: {
                    id: order_id,
                    amount,
                    status_id: 1,
                    pay_url_token
                },
                items,
                pay_url: `${payUrlBase}/${pay_url_token}`
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Lista las ordenes de la empresa.
     * El vendedor solo ve las suyas; el administrador ve todas y puede filtrar
     * por vendedor o por estado.
     *
     * @static
     * @memberof OrderController
     */
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const is_admin = session.role === 'admin';

            const where: string[] = [];
            const replacements: Record<string, any> = {};

            if (is_admin) {
                if (req.query.seller_id) {
                    where.push('o.user_id = :seller_id');
                    replacements.seller_id = req.query.seller_id;
                }
            } else {
                // Un vendedor nunca puede ver ordenes de otro, aunque lo intente por query
                where.push('o.user_id = :user_id');
                replacements.user_id = session.user.uuid;
            }

            if (req.query.status_id) {
                where.push('o.status_id = :status_id');
                replacements.status_id = req.query.status_id;
            }

            const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

            const orders = await tenantDb.query(
                `SELECT o.*, COUNT(oi.id) AS items_count
                 FROM orders o
                 LEFT JOIN order_items oi ON oi.order_id = o.id
                 ${whereClause}
                 GROUP BY o.id
                 ORDER BY o.createdAt DESC`,
                { replacements, type: QueryTypes.SELECT }
            );

            res.json(orders);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Cambia el estado de una orden (pendiente, pagado, atrasado)
     *
     * @static
     * @memberof OrderController
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const is_admin = session.role === 'admin';
            const { id } = req.params;
            const { status_id } = req.body;

            if (!status_id) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Debes indicar el nuevo estado.' });
                return;
            }

            const where = is_admin ? 'id = :id' : 'id = :id AND user_id = :user_id';
            const replacements: Record<string, any> = { id, user_id: session.user.uuid };

            const [order] = await tenantDb.query(`SELECT id FROM orders WHERE ${where}`, {
                replacements,
                type: QueryTypes.SELECT
            });

            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Esa orden no existe o no te pertenece.' });
                return;
            }

            await tenantDb.query(`UPDATE orders SET status_id = :status_id, updatedAt = NOW() WHERE id = :id`, {
                replacements: { status_id, id }
            });

            res.json({ message: 'Estado actualizado' });
        } catch (err) {
            next(err);
        }
    }
}
