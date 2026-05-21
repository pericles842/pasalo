import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

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