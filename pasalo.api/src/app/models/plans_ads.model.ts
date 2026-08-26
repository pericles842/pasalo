import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { AdLocationModel } from './ad_location.model';
import { PlanAdsLocationModel } from './plan_ads_location.model';

// Catalogo de planes de publicidad (distinto de PlanModel, que es el plan de suscripcion de Pasalo).
// Un plan ya no tiene un placement fijo: incluye una o mas `AdLocationModel` via `plan_ads_locations`
// (ver `locations` mas abajo), lo que permite vender combos (ej. header + footer del menu) y agregar
// ubicaciones nuevas sin tocar esquema ni codigo.
export class PlanAdsModel extends Model<InferAttributes<PlanAdsModel>, InferCreationAttributes<PlanAdsModel>> {
    declare id: CreationOptional<number>;

    declare name: string;
    declare priority: CreationOptional<number>;
    declare price: number;
    declare duration_days: CreationOptional<number>;
    declare description: CreationOptional<string | null>;
    declare status: CreationOptional<'active' | 'inactive'>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

PlanAdsModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre del plan de publicidad es requerido' }
            }
        },
        priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 10
            }
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: {
                isNumeric: { msg: 'El precio debe ser un número válido' }
            }
        },
        duration_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
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
        tableName: 'plans_ads',
        timestamps: true
    }
);

PlanAdsModel.belongsToMany(AdLocationModel, {
    through: PlanAdsLocationModel,
    foreignKey: 'plan_ads_id',
    otherKey: 'ad_location_id',
    as: 'locations'
});
AdLocationModel.belongsToMany(PlanAdsModel, {
    through: PlanAdsLocationModel,
    foreignKey: 'ad_location_id',
    otherKey: 'plan_ads_id',
    as: 'plans'
});
