import { QueryTypes, Sequelize } from 'sequelize';
import { sequelize } from './db';

interface CompanyConnection {
    db_name: string;
    db_host: string;
    db_port: number;
    db_user: string;
    db_password: string;
}

// Una conexion por tenant, reutilizada entre requests
const tenantConnections = new Map<string, Sequelize>();

/**
 * Devuelve (y cachea) la conexion a la base de datos de la empresa,
 * resuelta a partir de su tenant_id contra companies_connections.
 *
 * @export
 * @param {string} tenant_id
 * @return {Promise<Sequelize>}
 */
export async function getTenantConnection(tenant_id: string): Promise<Sequelize> {
    const cached = tenantConnections.get(tenant_id);
    if (cached) return cached;

    const [connection] = await sequelize.query<CompanyConnection>(
        `SELECT cc.db_name, cc.db_host, cc.db_port, cc.db_user, cc.db_password
         FROM companies_connections cc
         JOIN companies c ON c.uuid = cc.id_company
         WHERE c.tenant_id = :tenant_id`,
        { replacements: { tenant_id }, type: QueryTypes.SELECT }
    );

    if (!connection) {
        throw new Error(`No se encontro la conexion de la empresa "${tenant_id}"`);
    }

    const tenantSequelize = new Sequelize(connection.db_name, connection.db_user, connection.db_password, {
        host: connection.db_host,
        port: Number(connection.db_port),
        dialect: 'mysql',
        logging: false,
        pool: { max: 5, min: 0, acquire: 60000, idle: 10000 }
    });

    tenantConnections.set(tenant_id, tenantSequelize);
    return tenantSequelize;
}
