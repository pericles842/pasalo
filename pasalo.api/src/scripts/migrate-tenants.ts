import dotenv from 'dotenv';
dotenv.config();

import { QueryTypes } from 'sequelize';
import { sequelize } from '../app/config/db';
import { CompanyModel } from '../app/models/company.model';

/**
 * Aplica las migraciones pendientes de pasalo-client a TODAS las empresas
 * ya existentes. Las empresas nuevas ya las reciben al registrarse; este
 * script es para ponerse al dia cuando se agrega una migracion nueva.
 *
 * Uso: npm run migrate:tenants
 */
(async () => {
    const connections = await sequelize.query<{ db_name: string }>('SELECT db_name FROM companies_connections', {
        type: QueryTypes.SELECT
    });

    for (const c of connections) {
        console.log('Migrando tenant:', c.db_name);
        await CompanyModel.generateTablesForCompanyClient(c.db_name);
    }

    console.log('Listo');
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
