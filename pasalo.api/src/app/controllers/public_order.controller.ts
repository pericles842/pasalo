import { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import { getTenantConnection } from '../config/tenant';
import { randomUUID } from 'crypto';
import { extractReceiptData } from '../../utils/ocr';
import { uploadFile } from '../../utils/storage';
import { buildImagePrefix } from '../../utils/fileNaming';
import { getExchangeRates, RateType } from '../../utils/exchangeRate';
import { notifyOrderPaid } from '../config/socket';

// Metodos que se cobran en bolivares: el comprobante muestra Bs, no USD
const BS_PAYMENT_TYPES = ['pagomovil', 'transferencia'];

// Default cuando la empresa todavia no configuro este campo (editable por el admin luego)
const DEFAULT_REQUIRED_BUYER_FIELDS = ['first_name', 'email'];

// required_buyer_fields (JSON) puede llegar ya parseada o como string sin parsear, segun la consulta
function normalizeRequiredFields(value: unknown): string[] {
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // cae al default
        }
    }

    return DEFAULT_REQUIRED_BUYER_FIELDS;
}

// Tolerancia para diferencias de redondeo / variacion de tasa entre que se
// creo la orden y se pago
const AMOUNT_TOLERANCE = 0.03;

// Minimo de digitos en el texto reconocido para considerar que la foto es un
// comprobante real y no una imagen cualquiera (logo, foto random, etc.)
const MIN_RECEIPT_DIGITS = 4;

export class PublicOrderController {

    /**
     * Un link vencido ya no se puede usar para pagar, pero si ya se pago
     * (2 = pagado, 5 = verificado) el vencimiento deja de importar: la
     * pantalla de "ya pagamos tu orden" tiene prioridad.
     */
    private static isExpired(order: { status_id: number; expires_at: string | Date | null }): boolean {
        if (order.status_id === 2 || order.status_id === 5) return false;
        if (!order.expires_at) return false;

        return new Date(order.expires_at).getTime() < Date.now();
    }

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
                `SELECT o.id, o.company_id, o.user_id, o.amount, o.bs_amount, o.status_id, o.first_name_client, o.last_name_client,
                        o.expires_at,
                        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
                 FROM orders o
                 WHERE o.pay_url_token = :token`,
                { replacements: { token }, type: QueryTypes.SELECT }
            );

            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Este link de pago no es válido.' });
                return;
            }

            order.is_expired = PublicOrderController.isExpired(order);

            // El vendedor y la empresa viven en la base master, no en la del tenant
            const [seller] = await sequelize.query<any>(
                `SELECT first_name, middle_name, photo_url FROM users WHERE uuid = :user_id`,
                { replacements: { user_id: order.user_id }, type: QueryTypes.SELECT }
            );

            const [company] = await sequelize.query<any>(
                `SELECT name, logo_url, default_rate_type, required_buyer_fields FROM companies WHERE uuid = :company_id`,
                { replacements: { company_id: order.company_id }, type: QueryTypes.SELECT }
            );

            const rate_type: RateType = company?.default_rate_type ?? 'bcv';
            const rates = await getExchangeRates().catch(() => null);

            order.seller_name = seller ? `${seller.first_name} ${seller.middle_name ?? ''}`.trim() : null;
            order.seller_photo_url = seller?.photo_url ?? null;
            order.company_name = company?.name ?? null;
            order.logo_url = company?.logo_url ?? null;
            order.rate_type = rate_type;
            order.rate_value = rates?.[rate_type] ?? null;
            order.required_fields = normalizeRequiredFields(company?.required_buyer_fields);

            // El vendedor pudo fijar un Bs manual al crear la orden (mas confiable
            // que la tasa del momento): si existe, es el que se muestra al comprador
            if (order.bs_amount === null || order.bs_amount === undefined) {
                const rate = rates?.[rate_type];
                order.bs_amount = rate ? Number(order.amount) * rate : null;
            } else {
                order.bs_amount = Number(order.bs_amount);
            }

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
     * Paso 1 del link publico: el cliente llena sus propios datos (el
     * vendedor solo cargo los productos al crear la orden). Se puede volver
     * a llamar para corregir algo, siempre que la orden no este ya pagada.
     *
     * @static
     * @memberof PublicOrderController
     */
    static async submitBuyerData(req: Request, res: Response, next: NextFunction) {
        try {
            const tenant_id = req.params.tenant_id as string;
            const token = req.params.token as string;
            const buyer_data: Record<string, string | undefined> = req.body;
            const { address } = req.body;

            const tenantDb = await getTenantConnection(tenant_id);

            const [order] = await tenantDb.query<any>(
                `SELECT id, company_id, status_id, expires_at FROM orders WHERE pay_url_token = :token`,
                { replacements: { token }, type: QueryTypes.SELECT }
            );

            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Este link de pago no es válido.' });
                return;
            }

            const [company] = await sequelize.query<any>(
                `SELECT required_buyer_fields FROM companies WHERE uuid = :company_id`,
                { replacements: { company_id: order.company_id }, type: QueryTypes.SELECT }
            );

            const required_fields = normalizeRequiredFields(company?.required_buyer_fields);
            const missing = required_fields.filter((field) => !buyer_data[field]);

            // El pin del mapa comparte el mismo checkbox "Ubicacion" que el texto
            // libre: si la empresa lo marco como requerido, no basta con escribir
            // la direccion, tambien hay que haber marcado un punto en el mapa.
            const { lat, lng } = req.body;
            const missing_location = required_fields.includes('address') && (!lat || !lng);

            if (missing.length > 0 || missing_location) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Completa todos tus datos.' });
                return;
            }

            const { first_name, last_name, email, ci, phone } = req.body;

            // 2 = pagado, 5 = verificado: ya no se puede tocar la orden
            if (order.status_id === 2 || order.status_id === 5) {
                res.status(409).json({ message: 'Ya pagado', error: 'Esta orden ya fue pagada.' });
                return;
            }

            if (PublicOrderController.isExpired(order)) {
                res.status(410).json({ message: 'Link vencido', error: 'Este link de pago ya venció.' });
                return;
            }

            await tenantDb.query(
                `UPDATE orders
                 SET first_name_client = :first_name, last_name_client = :last_name, email_client = :email,
                     ci_client = :ci, phone_client = :phone, address_client = :address,
                     lat = :lat, lng = :lng, updatedAt = NOW()
                 WHERE id = :id`,
                {
                    replacements: {
                        id: order.id,
                        first_name: first_name?.trim() || null,
                        last_name: last_name?.trim() || null,
                        email: email?.trim() || null,
                        ci: ci?.trim() || null,
                        phone: phone?.trim() || null,
                        address: address?.trim() || null,
                        lat: lat ? Number(lat) : null,
                        lng: lng ? Number(lng) : null
                    }
                }
            );

            res.json({ message: 'Datos guardados' });
        } catch (err) {
            next(err);
        }
    }

    /**
     * El cliente sube su comprobante y elige con que metodo pago.
     * Se intenta extraer la referencia y el monto de la imagen. Si el monto no
     * coincide con lo que la orden espera, la orden NO pasa a pagado sola:
     * queda marcada como sospechosa para que el vendedor la revise a mano. Si
     * la foto no trae suficientes numeros (no es un comprobante), se rechaza
     * directo.
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
                `SELECT id, company_id, user_id, status_id, amount, bs_amount, first_name_client, last_name_client, expires_at
                 FROM orders WHERE pay_url_token = :token`,
                { replacements: { token }, type: QueryTypes.SELECT }
            );

            if (!order) {
                res.status(404).json({ message: 'Orden no encontrada', error: 'Este link de pago no es válido.' });
                return;
            }

            // 2 = pagado, 5 = verificado por el vendedor
            if (order.status_id === 2 || order.status_id === 5) {
                res.status(409).json({ message: 'Ya pagado', error: 'Esta orden ya tiene un comprobante registrado.' });
                return;
            }

            if (PublicOrderController.isExpired(order)) {
                res.status(410).json({ message: 'Link vencido', error: 'Este link de pago ya venció.' });
                return;
            }

            // El paso 1 (datos del comprador) es obligatorio antes de poder pagar
            if (!order.first_name_client) {
                res.status(409).json({ message: 'Faltan tus datos', error: 'Completa tus datos antes de subir el comprobante.' });
                return;
            }

            const [method] = await tenantDb.query<any>(
                `SELECT type FROM payment_methods WHERE id = :payment_method_id`,
                { replacements: { payment_method_id }, type: QueryTypes.SELECT }
            );

            const [company] = await sequelize.query<any>(
                `SELECT name, default_rate_type FROM companies WHERE uuid = :company_id`,
                { replacements: { company_id: order.company_id }, type: QueryTypes.SELECT }
            );

            const namePrefix = buildImagePrefix(tenant_id, company?.name ?? tenant_id);

            const [{ reference, amount: extracted_amount, raw_text }, uploaded] = await Promise.all([
                extractReceiptData(file.buffer),
                uploadFile(file, `receipts/${tenant_id}`, 'webp', { width: 1200, height: 1200, fit: 'inside' }, namePrefix)
            ]);

            // Si el metodo cobra en bolivares, el comprobante trae Bs: se compara
            // contra el Bs que el vendedor fijo al crear la orden (mas confiable que
            // recalcular con la tasa del momento del pago)
            let expected_amount = Number(order.amount);

            if (method && BS_PAYMENT_TYPES.includes(method.type)) {
                if (order.bs_amount !== null && order.bs_amount !== undefined) {
                    expected_amount = Number(order.bs_amount);
                } else {
                    // Orden vieja sin bs_amount: se cae al calculo en vivo como respaldo
                    const rate_type: RateType = company?.default_rate_type ?? 'bcv';
                    const rates = await getExchangeRates().catch(() => null);
                    const rate = rates?.[rate_type];
                    expected_amount = rate ? Number(order.amount) * rate : 0; // sin tasa no hay con que comparar: no se marca sospechoso
                }
            }

            // Un comprobante real (monto, fecha, referencia, banco...) siempre trae
            // varios digitos. Con menos de MIN_RECEIPT_DIGITS la foto no es un
            // comprobante (ej. una imagen cualquiera subida por error): se rechaza
            // directo. Se pide mas de un solo digito porque el OCR a veces "lee"
            // un numero suelto en logos o texturas de una imagen sin nada que ver.
            const digit_count = (raw_text.match(/\d/g) ?? []).length;
            const is_invalid_receipt = digit_count < MIN_RECEIPT_DIGITS;

            const is_suspicious = !is_invalid_receipt && extracted_amount !== null && expected_amount > 0
                && Math.abs(extracted_amount - expected_amount) / expected_amount > AMOUNT_TOLERANCE;

            // Sin comprobante valido, rechazada directo. Si el monto no cuadra,
            // la orden NO pasa a pagado sola: queda como estaba (normalmente "En
            // espera") para que el vendedor la revise y confirme a mano.
            const new_status_id = is_invalid_receipt ? 4 : (is_suspicious ? order.status_id : 2);

            await tenantDb.query(
                `UPDATE orders
                 SET status_id = :status_id, payment_method_id = :payment_method_id, receipt_url = :receipt_url,
                     extracted_reference = :reference, extracted_amount = :extracted_amount,
                     is_suspicious = :is_suspicious, is_invalid_receipt = :is_invalid_receipt,
                     extracted_raw_text = :raw_text,
                     paid_at = CASE WHEN :status_id = 2 THEN NOW() ELSE paid_at END,
                     updatedAt = NOW()
                 WHERE id = :id`,
                {
                    replacements: {
                        id: order.id,
                        status_id: new_status_id,
                        payment_method_id,
                        receipt_url: uploaded.url,
                        reference,
                        extracted_amount,
                        is_suspicious,
                        is_invalid_receipt,
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
                is_suspicious,
                createdAt: new Date()
            }]);

            notifyOrderPaid(tenant_id, order.user_id, {
                order_id: order.id,
                buyer_name,
                amount: order.amount,
                reference,
                receipt_url: uploaded.url,
                is_suspicious
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
