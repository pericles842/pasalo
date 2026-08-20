import { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import { getTenantConnection } from '../config/tenant';
import { randomUUID } from 'crypto';
import { extractPaymentReference } from '../../utils/ocr';
import { uploadFile } from '../../utils/storage';
import { notifyOrderPaid } from '../config/socket';

export class PublicOrderController {

    /**
     * Lo que ve el cliente al abrir su link de pago: cuanto debe, cuantos
     * productos, quien le vendio, y con que metodos puede pagar.
     *
     * @static
     * @memberof PublicOrderController
     */
    static async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const tenant_id = req.params.tenant_id as string;
            const token = req.params.token as string;
            const tenantDb = await getTenantConnection(tenant_id);

            const [order] = await tenantDb.query<any>(
                `SELECT o.id, o.company_id, o.user_id, o.amount, o.status_id, o.first_name_client, o.last_name_client,
                        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
                 FROM orders o
                 WHERE o.pay_url_token = :token`,
                { replacements: { token }, type: QueryTypes.SELECT }
            );

            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Este link de pago no es válido.' });
                return;
            }

            // El vendedor y la empresa viven en la base master, no en la del tenant
            const [seller] = await sequelize.query<any>(
                `SELECT first_name, middle_name FROM users WHERE uuid = :user_id`,
                { replacements: { user_id: order.user_id }, type: QueryTypes.SELECT }
            );

            const [company] = await sequelize.query<any>(
                `SELECT name FROM companies WHERE uuid = :company_id`,
                { replacements: { company_id: order.company_id }, type: QueryTypes.SELECT }
            );

            order.seller_name = seller ? `${seller.first_name} ${seller.middle_name ?? ''}`.trim() : null;
            order.company_name = company?.name ?? null;

            const methods = await tenantDb.query(
                `SELECT pm.id, pm.name, pm.type, pm.datos, pm.titular
                 FROM payment_methods pm
                 JOIN orders o ON o.company_id = pm.company_id
                 WHERE o.id = :order_id`,
                { replacements: { order_id: order.id }, type: QueryTypes.SELECT }
            );

            res.json({
                order,
                payment_methods: methods
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * El cliente sube su comprobante y elige con que metodo pago.
     * Se intenta extraer la referencia de la imagen y la orden pasa a "pagado".
     *
     * @static
     * @memberof PublicOrderController
     */
    static async submitPayment(req: Request, res: Response, next: NextFunction) {
        try {
            const tenant_id = req.params.tenant_id as string;
            const token = req.params.token as string;
            const { payment_method_id } = req.body;
            const file = (req as any).file;

            if (!payment_method_id) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Selecciona el método de pago.' });
                return;
            }

            if (!file) {
                res.status(400).json({ message: 'Comprobante requerido', error: 'Sube la foto de tu comprobante de pago.' });
                return;
            }

            const tenantDb = await getTenantConnection(tenant_id);

            const [order] = await tenantDb.query<any>(
                `SELECT id, company_id, user_id, status_id, amount, first_name_client, last_name_client
                 FROM orders WHERE pay_url_token = :token`,
                { replacements: { token }, type: QueryTypes.SELECT }
            );

            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Este link de pago no es válido.' });
                return;
            }

            if (order.status_id === 2) {
                res.status(409).json({ message: 'Ya pagado', error: 'Esta orden ya tiene un comprobante registrado.' });
                return;
            }

            const [{ reference, raw_text }, uploaded] = await Promise.all([
                extractPaymentReference(file.buffer),
                uploadFile(file, `receipts/${tenant_id}`, 'jpg', { width: 1200, height: 1200, fit: 'inside' })
            ]);

            await tenantDb.query(
                `UPDATE orders
                 SET status_id = 2, payment_method_id = :payment_method_id, receipt_url = :receipt_url,
                     extracted_reference = :reference, extracted_raw_text = :raw_text, paid_at = NOW(), updatedAt = NOW()
                 WHERE id = :id`,
                {
                    replacements: {
                        id: order.id,
                        payment_method_id,
                        receipt_url: uploaded.url,
                        reference,
                        raw_text
                    }
                }
            );

            const buyer_name = `${order.first_name_client} ${order.last_name_client}`.trim();

            // Queda como historial persistente ademas del aviso en vivo por websocket
            await tenantDb.getQueryInterface().bulkInsert('notifications', [{
                id: randomUUID(),
                company_id: order.company_id,
                order_id: order.id,
                seller_id: order.user_id,
                buyer_name,
                amount: order.amount,
                reference,
                createdAt: new Date()
            }]);

            notifyOrderPaid(tenant_id, order.user_id, {
                order_id: order.id,
                buyer_name,
                amount: order.amount,
                reference,
                receipt_url: uploaded.url
            });

            res.json({
                message: 'Pago registrado',
                extracted_reference: reference
            });
        } catch (err) {
            next(err);
        }
    }
}
