"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const crypto_1 = require("crypto");
const umzug_1 = require("umzug");
const path_1 = __importDefault(require("path"));
class CompanyModel extends sequelize_1.Model {
    static async createConnectionCompany(company, plan_id) {
        const db_client = `pasalo_${company.tenant_id}`;
        await db_1.sequelize.query(`CREATE DATABASE ${db_client}`);
        await CompanyModel.generateTablesForCompanyClient(db_client);
        await db_1.sequelize.getQueryInterface().bulkInsert('companies_connections', [
            {
                uuid: (0, crypto_1.randomUUID)(),
                id_company: company.uuid,
                db_name: db_client,
                db_host: process.env.DB_HOST,
                db_port: process.env.PORT,
                db_user: process.env.DB_USER,
                db_password: process.env.DB_PASS,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
        await db_1.sequelize.getQueryInterface().bulkInsert('companies_subscriptions', [
            {
                uuid: (0, crypto_1.randomUUID)(),
                company_id: company.uuid,
                plan_id: plan_id,
                status_id: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
        return await db_1.sequelize.query(`SELECT * FROM companies_subscriptions WHERE company_id = :company_id`, {
            replacements: { company_id: company.uuid },
            type: sequelize_1.QueryTypes.SELECT
        });
    }
    /**
     * Genra las tablas de la db de la cpmpa;ia
     *
     * @static
     * @param {string} db_client
     * @memberof CompanyModel
     */
    static async generateTablesForCompanyClient(db_client) {
        const tenantSequelize = new sequelize_1.Sequelize(db_client, process.env.DB_USER, process.env.DB_PASS, {
            host: process.env.DB_HOST,
            dialect: 'mysql',
            logging: false
        });
        const migrator = new umzug_1.Umzug({
            migrations: {
                glob: path_1.default.join(__dirname, '../../../migrations/pasalo-client/*.js'),
                resolve: ({ name, path, context }) => {
                    const migration = require(path);
                    return {
                        name,
                        up: async () => migration.up(context, sequelize_1.Sequelize),
                        down: async () => migration.down(context, sequelize_1.Sequelize),
                    };
                },
            },
            context: tenantSequelize.getQueryInterface(),
            storage: new umzug_1.SequelizeStorage({ sequelize: tenantSequelize }),
            logger: console,
        });
        await migrator.up();
        await tenantSequelize.close();
    }
}
exports.CompanyModel = CompanyModel;
CompanyModel.init({
    uuid: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            min: { args: [3], msg: 'El nombre debe tener al menos 3 caracteres' }
        }
    },
    logo_url: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    rif: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El RIF es requerido' }
        },
        unique: true
    },
    tenant_id: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El Tenant ID es requerido' },
        },
        unique: true
    },
    domain: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El dominio es requerido' }
        }
    },
    user_limit: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize: db_1.sequelize,
    tableName: 'companies',
    timestamps: true
});
