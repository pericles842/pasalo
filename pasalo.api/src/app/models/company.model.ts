import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, QueryTypes, Sequelize, Transaction } from 'sequelize';
import { sequelize } from '../config/db';
import { randomUUID } from 'crypto';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';

export class CompanyModel extends Model<InferAttributes<CompanyModel>, InferCreationAttributes<CompanyModel>> {
  // Llave primaria UUID
  declare uuid: CreationOptional<string>;

  declare name: string;
  declare rif: CreationOptional<string | null>;
  declare email: string;
  declare tenant_id: string;
  declare domain: string;


  declare logo_url: CreationOptional<string | null>;
  // Lo define el plan contratado, no el formulario de registro
  declare user_limit: CreationOptional<number>;

  // Timestamps automáticos
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;


  /**
   * Nombre de la base de datos de la compañía
   *
   * @static
   * @param {string} tenant_id
   * @memberof CompanyModel
   */
  static tenantDbName(tenant_id: string): string {
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
  static async createSubscription(company: CompanyModel, plan: { id: number; price: number }, transaction?: Transaction) {
    const FREE_PLAN_ID = 1;
    const SUBSCRIPTION_PERIOD_DAYS = 30;
    const is_free = Number(plan.price) === 0;

    await sequelize.getQueryInterface().bulkInsert('companies_subscriptions', [
      {
        uuid: randomUUID(),
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

    const [subscription] = await sequelize.query(`SELECT * FROM companies_subscriptions WHERE company_id = :company_id`, {
      replacements: { company_id: company.uuid },
      type: QueryTypes.SELECT,
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
  static async createConnectionCompany(company: CompanyModel) {

    const db_client = CompanyModel.tenantDbName(company.tenant_id);
    await sequelize.query(`CREATE DATABASE \`${db_client}\``);
    await CompanyModel.generateTablesForCompanyClient(db_client);

    await sequelize.getQueryInterface().bulkInsert('companies_connections', [
      {
        uuid: randomUUID(),
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
  static async dropConnectionCompany(tenant_id: string) {
    await sequelize.query(`DROP DATABASE IF EXISTS \`${CompanyModel.tenantDbName(tenant_id)}\``);
  }

  /**
   * Genra las tablas de la db de la cpmpa;ia
   *
   * @static
   * @param {string} db_client
   * @memberof CompanyModel
   */
  static async generateTablesForCompanyClient(db_client: string) {
    const tenantSequelize = new Sequelize(db_client, process.env.DB_USER!, process.env.DB_PASS!, {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: 'mysql',
      logging: false
    });


    const migrator = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../../../migrations/pasalo-client/*.js').split(path.sep).join('/'),

        resolve: ({ name, path: migrationPath, context }) => {
          const migration = require(migrationPath!);
          return {
            name,
            up: async () => migration.up(context, Sequelize),
            down: async () => migration.down(context, Sequelize),
          };
        },
      },
      context: tenantSequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: tenantSequelize }),
      logger: console,
    });


    await migrator.up();
    await tenantSequelize.close();
  }
}

CompanyModel.init(
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre es requerido' },
        min: { args: [3], msg: 'El nombre debe tener al menos 3 caracteres' }
      }
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rif: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El correo de la empresa es requerido' },
        isEmail: { msg: 'El correo de la empresa no es válido' }
      }
    },
    tenant_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El Tenant ID es requerido' },
      },
      unique: true
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El dominio es requerido' }
      }
    },
    user_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'companies',
    timestamps: true
  }
);
