import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

/** Clave libre (no enum): "header-dashboard", "modal", etc. Anadir una ubicacion nueva es solo una fila mas. */
export type AdLocationKey = string;

// Catalogo de ubicaciones de publicidad disponibles en la plataforma. Un plan
// de publicidad (`PlanAdsModel`) incluye una o mas de estas via `plan_ads_locations`.
export class AdLocationModel extends Model<InferAttributes<AdLocationModel>, InferCreationAttributes<AdLocationModel>> {
    declare id: CreationOptional<number>;

    declare key: AdLocationKey;
    declare name: string;
    declare status: CreationOptional<'active' | 'inactive'>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

AdLocationModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'La clave de la ubicación es requerida' },
                is: {
                    args: /^[a-z0-9-]+$/,
                    msg: 'La clave debe ser minusculas, numeros y guiones (ej. header-dashboard)'
                }
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre de la ubicación es requerido' }
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active'
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
        tableName: 'ads_locations',
        timestamps: true
    }
);
