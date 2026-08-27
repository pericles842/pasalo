"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
const tenant_1 = require("../app/config/tenant");
/**
 * Resuelve la conexion a la base de datos de la empresa del usuario logueado
 * y la deja disponible en req.tenantDb. Debe ir despues de jwtMiddleware.
 */
async function tenantMiddleware(req, res, next) {
    try {
        const session = req.session;
        req.tenantDb = await (0, tenant_1.getTenantConnection)(session.company.tenant_id);
        next();
    }
    catch (err) {
        next(err);
    }
}
