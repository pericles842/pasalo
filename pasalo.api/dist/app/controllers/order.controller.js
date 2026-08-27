"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const sequelize_1 = require("sequelize");
const crypto_1 = require("crypto");
const db_1 = require("../config/db");
class OrderController {
    static session(req) {
        return req.session;
    }
    static tenantDb(req) {
        return req.tenantDb;
    }
    /**
     * Crea la orden (la venta) con sus renglones de productos. El vendedor
     * solo carga los productos: los datos del comprador los llena el cliente
     * despues, en el paso 1 del link publico de pago.
     * Se asigna siempre al vendedor que la crea.
     *
     * @static
     * @memberof OrderController
     */
    static async create(req, res, next) {
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const { items, notes } = req.body;
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
            // Sin metodos de pago el cliente nunca podria pagar el link que se genera
            const [{ total: payment_methods_total }] = await tenantDb.query(`SELECT COUNT(*) AS total FROM payment_methods WHERE company_id = :company_id`, { replacements: { company_id: session.company.uuid }, type: sequelize_1.QueryTypes.SELECT });
            if (Number(payment_methods_total) === 0) {
                res.status(409).json({
                    message: 'Sin métodos de pago',
                    error: 'Agrega al menos un método de pago antes de crear una orden.'
                });
                return;
            }
            // Se lee fresco (no del token) para que un cambio de duracion aplique
            // de inmediato, sin esperar a que el vendedor vuelva a iniciar sesion
            const [company] = await db_1.sequelize.query(`SELECT link_expiration_minutes FROM companies WHERE uuid = :company_id`, { replacements: { company_id: session.company.uuid }, type: sequelize_1.QueryTypes.SELECT });
            const link_expiration_minutes = company?.link_expiration_minutes ?? 30;
            const order_id = (0, crypto_1.randomUUID)();
            const pay_url_token = (0, crypto_1.randomUUID)();
            const amount = items.reduce((total, item) => total + Number(item.price), 0);
            const expires_at = new Date(Date.now() + link_expiration_minutes * 60 * 1000);
            await tenantDb.getQueryInterface().bulkInsert('orders', [{
                    id: order_id,
                    company_id: session.company.uuid,
                    user_id: session.user.uuid,
                    notes: notes ?? null,
                    amount,
                    status_id: 1,
                    pay_url_token,
                    expires_at,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }]);
            await tenantDb.getQueryInterface().bulkInsert('order_items', items.map((item) => ({
                id: (0, crypto_1.randomUUID)(),
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
                // El tenant_id viaja en la url: es la unica forma de resolver la empresa
                // en una pagina publica que no tiene sesion
                pay_url: `${payUrlBase}/${session.company.tenant_id}/${pay_url_token}`
            });
        }
        catch (err) {
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
    static async list(req, res, next) {
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const is_admin = session.role === 'admin';
            const where = [];
            const replacements = {};
            if (is_admin) {
                if (req.query.seller_id) {
                    where.push('o.user_id = :seller_id');
                    replacements.seller_id = req.query.seller_id;
                }
            }
            else {
                // Un vendedor nunca puede ver ordenes de otro, aunque lo intente por query
                where.push('o.user_id = :user_id');
                replacements.user_id = session.user.uuid;
            }
            if (req.query.status_id) {
                where.push('o.status_id = :status_id');
                replacements.status_id = req.query.status_id;
            }
            const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
            const limit = Math.min(Number(req.query.limit) || 10, 50);
            const page = Math.max(Number(req.query.page) || 1, 1);
            const offset = (page - 1) * limit;
            const [{ total }] = await tenantDb.query(`SELECT COUNT(*) AS total FROM orders o ${whereClause}`, { replacements, type: sequelize_1.QueryTypes.SELECT });
            const orders = await tenantDb.query(`SELECT o.*, pm.type AS payment_method_type, COUNT(oi.id) AS items_count
                 FROM orders o
                 LEFT JOIN order_items oi ON oi.order_id = o.id
                 LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
                 ${whereClause}
                 GROUP BY o.id
                 ORDER BY o.createdAt DESC
                 LIMIT ${limit} OFFSET ${offset}`, { replacements, type: sequelize_1.QueryTypes.SELECT });
            // El vendedor vive en la base master: se resuelve aparte y se pega por uuid.
            // Para el admin es imprescindible (ve ordenes de todos); para el vendedor,
            // solo hace falta reconocer las suyas.
            if (orders.length) {
                const seller_ids = [...new Set(orders.map((o) => o.user_id))];
                const sellers = await db_1.sequelize.query(`SELECT uuid, first_name, middle_name FROM users WHERE uuid IN (:seller_ids)`, { replacements: { seller_ids }, type: sequelize_1.QueryTypes.SELECT });
                const sellerNames = new Map(sellers.map((s) => [s.uuid, `${s.first_name} ${s.middle_name ?? ''}`.trim()]));
                for (const o of orders) {
                    o.seller_name = sellerNames.get(o.user_id) ?? null;
                }
            }
            res.json({
                orders,
                total: Number(total),
                page,
                limit,
                total_pages: Math.max(1, Math.ceil(Number(total) / limit))
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Detalle de una orden: comprador, productos, comprobante subido y lo
     * que la extraccion automatica logro leer.
     *
     * @static
     * @memberof OrderController
     */
    static async getById(req, res, next) {
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const is_admin = session.role === 'admin';
            const { id } = req.params;
            const where = is_admin ? 'o.id = :id' : 'o.id = :id AND o.user_id = :user_id';
            const [order] = await tenantDb.query(`SELECT o.*, pm.name AS payment_method_name, pm.type AS payment_method_type
                 FROM orders o
                 LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
                 WHERE ${where}`, { replacements: { id, user_id: session.user.uuid }, type: sequelize_1.QueryTypes.SELECT });
            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Esa orden no existe o no te pertenece.' });
                return;
            }
            const items = await tenantDb.query(`SELECT id, name, reference, price FROM order_items WHERE order_id = :id`, { replacements: { id }, type: sequelize_1.QueryTypes.SELECT });
            res.json({ order, items });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Cambia el estado de una orden (pendiente, pagado, atrasado)
     *
     * @static
     * @memberof OrderController
     */
    static async updateStatus(req, res, next) {
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
            const replacements = { id, user_id: session.user.uuid };
            const [order] = await tenantDb.query(`SELECT id FROM orders WHERE ${where}`, {
                replacements,
                type: sequelize_1.QueryTypes.SELECT
            });
            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Esa orden no existe o no te pertenece.' });
                return;
            }
            // Si se confirma como pagado (p.ej. desde el boton de "Confirmar pago" de una
            // orden sospechosa) y todavia no tenia fecha de pago, se estampa ahora
            await tenantDb.query(`UPDATE orders
                 SET status_id = :status_id, updatedAt = NOW(),
                     paid_at = CASE WHEN :status_id = 2 AND paid_at IS NULL THEN NOW() ELSE paid_at END
                 WHERE id = :id`, { replacements: { status_id, id } });
            res.json({ message: 'Estado actualizado' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * Tarjetas informativas del admin: ventas, clientes, ordenes, rechazadas,
     * completadas (verificadas) y vendedores con al menos una completada.
     * Todo se filtra por rango de fecha de creacion de la orden, salvo la
     * cantidad de metodos de pago (eso es configuracion actual, no historico).
     *
     * @static
     * @memberof OrderController
     */
    static async stats(req, res, next) {
        if (OrderController.session(req).role !== 'admin') {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede ver las estadísticas.' });
            return;
        }
        try {
            const session = OrderController.session(req);
            const tenantDb = OrderController.tenantDb(req);
            const { date_from, date_to } = req.query;
            const replacements = {
                date_from: date_from || null,
                date_to: date_to || null
            };
            // 5 = verificado, 4 = rechazado
            const [stats] = await tenantDb.query(`SELECT
                    COALESCE(SUM(CASE WHEN status_id = 5 THEN amount ELSE 0 END), 0) AS total_ventas,
                    COUNT(DISTINCT email_client) AS total_clientes,
                    COUNT(*) AS total_ordenes,
                    COUNT(CASE WHEN status_id = 4 THEN 1 END) AS total_rechazadas,
                    COUNT(CASE WHEN status_id = 5 THEN 1 END) AS total_completadas,
                    COUNT(DISTINCT CASE WHEN status_id = 5 THEN user_id END) AS total_vendedores_completadas
                 FROM orders
                 WHERE (:date_from IS NULL OR createdAt >= :date_from)
                   AND (:date_to IS NULL OR createdAt <= :date_to)`, { replacements, type: sequelize_1.QueryTypes.SELECT });
            const [{ total: payment_methods_count }] = await tenantDb.query(`SELECT COUNT(*) AS total FROM payment_methods WHERE company_id = :company_id`, { replacements: { company_id: session.company.uuid }, type: sequelize_1.QueryTypes.SELECT });
            res.json({
                total_ventas: Number(stats.total_ventas),
                total_clientes: Number(stats.total_clientes),
                total_ordenes: Number(stats.total_ordenes),
                total_rechazadas: Number(stats.total_rechazadas),
                total_completadas: Number(stats.total_completadas),
                total_vendedores_completadas: Number(stats.total_vendedores_completadas),
                payment_methods_count: Number(payment_methods_count)
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.OrderController = OrderController;
