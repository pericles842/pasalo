"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantConnection = getTenantConnection;
const sequelize_1 = require("sequelize");
const db_1 = require("./db");
// Una conexion por tenant, reutilizada entre requests
const tenantConnections = new Map();
/**
 * Devuelve (y cachea) la conexion a la base de datos de la empresa,
 * resuelta a partir de su tenant_id contra companies_connections.
 *
 * @export
 * @param {string} tenant_id
 * @return {Promise<Sequelize>}
 */
async function getTenantConnection(tenant_id) {
    const cached = tenantConnections.get(tenant_id);
    if (cached)
        return cached;
    const [connection] = await db_1.sequelize.query(`SELECT cc.db_name, cc.db_host, cc.db_port, cc.db_user, cc.db_password
         FROM companies_connections cc
         JOIN companies c ON c.uuid = cc.id_company
         WHERE c.tenant_id = :tenant_id`, { replacements: { tenant_id }, type: sequelize_1.QueryTypes.SELECT });
    if (!connection) {
        throw new Error(`No se encontro la conexion de la empresa "${tenant_id}"`);
    }
    const tenantSequelize = new sequelize_1.Sequelize(connection.db_name, connection.db_user, connection.db_password, {
        host: connection.db_host,
        port: Number(connection.db_port),
        dialect: 'mysql',
        logging: false,
        pool: { max: 5, min: 0, acquire: 60000, idle: 10000 }
    });
    tenantConnections.set(tenant_id, tenantSequelize);
    return tenantSequelize;
}
