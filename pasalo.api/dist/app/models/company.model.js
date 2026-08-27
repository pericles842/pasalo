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
    /**
     * Nombre de la base de datos de la compañía
     *
     * @static
     * @param {string} tenant_id
     * @memberof CompanyModel
     */
    static tenantDbName(tenant_id) {
        return `pasalo_${tenant_id}`;
    }
    /**
     * Registra la suscripción de la empresa al plan seleccionado. Un plan pago
     * no se activa solo: la empresa nace en el plan gratuito y el plan pedido
     * queda en pending_plan_id hasta que se verifique el pago (por WhatsApp).
     *
     * @static
     * @param {CompanyModel} company
     * @param {PlanModel} plan
     * @param {Transaction} [transaction]
     * @memberof CompanyModel
     */
    static async createSubscription(company, plan, transaction) {
        const FREE_PLAN_ID = 1;
        const SUBSCRIPTION_PERIOD_DAYS = 30;
        const is_free = Number(plan.price) === 0;
        await db_1.sequelize.getQueryInterface().bulkInsert('companies_subscriptions', [
            {
                uuid: (0, crypto_1.randomUUID)(),
                company_id: company.uuid,
                plan_id: is_free ? plan.id : FREE_PLAN_ID,
                pending_plan_id: is_free ? null : plan.id,
                // 1 = Activo, 4 = Pendiente de verificación
                status_id: is_free ? 1 : 4,
                // El gratuito no vence; un plan pago corre sus 30 dias desde que se
                // pide, aunque la verificacion del pago llegue despues
                expires_at: is_free ? null : new Date(Date.now() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], { transaction });
        const [subscription] = await db_1.sequelize.query(`SELECT * FROM companies_subscriptions WHERE company_id = :company_id`, {
            replacements: { company_id: company.uuid },
            type: sequelize_1.QueryTypes.SELECT,
            transaction
        });
        return subscription;
    }
    /**
     * Crea la base de datos de la compañía con sus tablas y guarda la conexión
     *
     * @static
     * @param {CompanyModel} company
     * @memberof CompanyModel
     */
    static async createConnectionCompany(company) {
        const db_client = CompanyModel.tenantDbName(company.tenant_id);
        await db_1.sequelize.query(`CREATE DATABASE \`${db_client}\``);
        await CompanyModel.generateTablesForCompanyClient(db_client);
        await db_1.sequelize.getQueryInterface().bulkInsert('companies_connections', [
            {
                uuid: (0, crypto_1.randomUUID)(),
                id_company: company.uuid,
                db_name: db_client,
                db_host: process.env.DB_HOST,
                db_port: process.env.DB_PORT,
                db_user: process.env.DB_USER,
                db_password: process.env.DB_PASS,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
        return db_client;
    }
    /**
     * Elimina la base de datos de la compañía (rollback del registro)
     *
     * @static
     * @param {string} tenant_id
     * @memberof CompanyModel
     */
    static async dropConnectionCompany(tenant_id) {
        await db_1.sequelize.query(`DROP DATABASE IF EXISTS \`${CompanyModel.tenantDbName(tenant_id)}\``);
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
            port: Number(process.env.DB_PORT),
            dialect: 'mysql',
            logging: false
        });
        const migrator = new umzug_1.Umzug({
            migrations: {
                glob: path_1.default.join(__dirname, '../../../migrations/pasalo-client/*.js').split(path_1.default.sep).join('/'),
                resolve: ({ name, path: migrationPath, context }) => {
                    const migration = require(migrationPath);
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
        allowNull: true,
        unique: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El correo de la empresa es requerido' },
            isEmail: { msg: 'El correo de la empresa no es válido' }
        }
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
        allowNull: false,
        defaultValue: 0
    },
    link_expiration_minutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
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
