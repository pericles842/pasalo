"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sequelize_1 = require("sequelize");
const db_1 = require("../app/config/db");
const company_model_1 = require("../app/models/company.model");
/**
 * Aplica las migraciones pendientes de pasalo-client a TODAS las empresas
 * ya existentes. Las empresas nuevas ya las reciben al registrarse; este
 * script es para ponerse al dia cuando se agrega una migracion nueva.
 *
 * Uso: npm run migrate:tenants
 */
(async () => {
    const connections = await db_1.sequelize.query('SELECT db_name FROM companies_connections', {
        type: sequelize_1.QueryTypes.SELECT
    });
    for (const c of connections) {
        console.log('Migrando tenant:', c.db_name);
        await company_model_1.CompanyModel.generateTablesForCompanyClient(c.db_name);
    }
    console.log('Listo');
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
