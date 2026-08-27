"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodController = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const VALID_TYPES = ['pagomovil', 'transferencia', 'billetera_digital'];
class PaymentMethodController {
    static session(req) {
        return req.session;
    }
    static tenantDb(req) {
        return req.tenantDb;
    }
    static isAdmin(req) {
        return PaymentMethodController.session(req).role === 'admin';
    }
    /**
     * Métodos de pago usados vs. permitidos por el plan de la empresa.
     * El conteo vive en la base del tenant, el plan en la base master.
     *
     * @static
     * @param {string} company_id
     * @param {Sequelize} tenantDb
     * @memberof PaymentMethodController
     */
    static async getUsage(company_id, tenantDb) {
        const [used] = await tenantDb.query(`SELECT COUNT(*) AS total FROM payment_methods WHERE company_id = :company_id`, { replacements: { company_id }, type: sequelize_1.QueryTypes.SELECT });
        const [plan] = await db_1.sequelize.query(`SELECT p.* FROM companies_subscriptions cs
             JOIN plans p ON p.id = cs.plan_id
             WHERE cs.company_id = :company_id`, { replacements: { company_id }, type: sequelize_1.QueryTypes.SELECT });
        const limit = plan?.payment_methods_limit ?? 0;
        const total = Number(used.total);
        return {
            plan,
            usage: {
                used: total,
                limit,
                available: Math.max(0, limit - total)
            }
        };
    }
    /**
     * Métodos de pago de la empresa: es lo que ve el cliente en el link de pago
     * para elegir con qué pagar.
     *
     * @static
     * @memberof PaymentMethodController
     */
    static async list(req, res, next) {
        try {
            const session = PaymentMethodController.session(req);
            const tenantDb = PaymentMethodController.tenantDb(req);
            const methods = await tenantDb.query(`SELECT id, name, type, datos, titular, url_img, createdAt
                 FROM payment_methods
                 WHERE company_id = :company_id
                 ORDER BY createdAt ASC`, { replacements: { company_id: session.company.uuid }, type: sequelize_1.QueryTypes.SELECT });
            const { plan, usage } = await PaymentMethodController.getUsage(session.company.uuid, tenantDb);
            res.json({ methods, plan, usage });
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        if (!PaymentMethodController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede agregar métodos de pago.' });
            return;
        }
        try {
            const session = PaymentMethodController.session(req);
            const tenantDb = PaymentMethodController.tenantDb(req);
            const { name, type, titular, datos } = req.body;
            if (!name || !type || !VALID_TYPES.includes(type)) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Completa el nombre y un tipo válido de método de pago.' });
                return;
            }
            if (!datos || typeof datos !== 'object' || Object.keys(datos).length === 0) {
                res.status(400).json({ message: 'Datos incompletos', error: 'Completa los datos con los que el cliente pagará.' });
                return;
            }
            const { plan, usage } = await PaymentMethodController.getUsage(session.company.uuid, tenantDb);
            if (usage.available <= 0) {
                res.status(409).json({
                    message: 'Límite de métodos de pago alcanzado',
                    error: `Tu ${plan?.name ?? 'plan'} permite ${usage.limit} ${usage.limit === 1 ? 'método de pago' : 'métodos de pago'} y ya los tienes ocupados. Cambia de plan para agregar más.`,
                    usage
                });
                return;
            }
            // payment_methods.id es INTEGER autoincrement; se relee tras insertar
            // para devolver el registro completo con el id que MySQL asignó
            await tenantDb.getQueryInterface().bulkInsert('payment_methods', [{
                    company_id: session.company.uuid,
                    name,
                    type,
                    titular: titular ?? null,
                    datos: JSON.stringify(datos),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }]);
            const [created] = await tenantDb.query(`SELECT id, name, type, datos, titular, createdAt
                 FROM payment_methods
                 WHERE company_id = :company_id
                 ORDER BY createdAt DESC, id DESC
                 LIMIT 1`, { replacements: { company_id: session.company.uuid }, type: sequelize_1.QueryTypes.SELECT });
            const refreshed = await PaymentMethodController.getUsage(session.company.uuid, tenantDb);
            res.status(201).json({ method: created, usage: refreshed.usage });
        }
        catch (err) {
            next(err);
        }
    }
    static async remove(req, res, next) {
        if (!PaymentMethodController.isAdmin(req)) {
            res.status(403).json({ message: 'Acceso denegado', error: 'Solo el administrador puede eliminar métodos de pago.' });
            return;
        }
        try {
            const session = PaymentMethodController.session(req);
            const tenantDb = PaymentMethodController.tenantDb(req);
            const { id } = req.params;
            const deleted = await tenantDb.query(`DELETE FROM payment_methods WHERE id = :id AND company_id = :company_id`, { replacements: { id, company_id: session.company.uuid } });
            void deleted;
            const { usage } = await PaymentMethodController.getUsage(session.company.uuid, tenantDb);
            res.json({ message: 'Método de pago eliminado', usage });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PaymentMethodController = PaymentMethodController;
