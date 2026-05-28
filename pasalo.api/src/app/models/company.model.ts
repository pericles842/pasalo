import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, QueryTypes, Sequelize } from 'sequelize';
import { sequelize } from '../config/db';
import { randomUUID } from 'crypto';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';

export class CompanyModel extends Model<InferAttributes<CompanyModel>, InferCreationAttributes<CompanyModel>> {
  // Llave primaria UUID
  declare uuid: CreationOptional<string>;

  declare name: string;
  declare rif: string;
  declare tenant_id: string;
  declare domain: string;


  declare logo_url: string | null;
  declare user_limit: CreationOptional<number>;

  // Timestamps automáticos
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;


  static async createConnectionCompany(company: CompanyModel, plan_id: number,) {

    const db_client = `pasalo_${company.tenant_id}`
    await sequelize.query(`CREATE DATABASE ${db_client}`);
    await CompanyModel.generateTablesForCompanyClient(db_client);

    await sequelize.getQueryInterface().bulkInsert('companies_connections', [
      {
        uuid: randomUUID(),
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

    await sequelize.getQueryInterface().bulkInsert('companies_subscriptions', [
      {
        uuid: randomUUID(),
        company_id: company.uuid,
        plan_id: plan_id,
        status_id: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])

    return await sequelize.query(`SELECT * FROM companies_subscriptions WHERE company_id = :company_id`, {
      replacements: { company_id: company.uuid },
      type: QueryTypes.SELECT
    })

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
      dialect: 'mysql',
      logging: false
    });


    const migrator = new Umzug({
      migrations: {
        glob: path.join(__dirname, '../../../migrations/pasalo-client/*.js').replace(/\\/g, '/'),

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
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El RIF es requerido' }
      },
      unique: true
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
      allowNull: true,
      defaultValue: 1
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