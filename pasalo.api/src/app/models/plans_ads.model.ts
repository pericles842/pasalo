import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export type AdPlacement = 'header' | 'footer' | 'sidebar' | 'dashboard_static' | 'modal';

// Catalogo de planes de publicidad (distinto de PlanModel, que es el plan de suscripcion de Pasalo)
export class PlanAdsModel extends Model<InferAttributes<PlanAdsModel>, InferCreationAttributes<PlanAdsModel>> {
    declare id: CreationOptional<number>;

    declare name: string;
    declare placement: AdPlacement;
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
        placement: {
            type: DataTypes.ENUM('header', 'footer', 'sidebar', 'dashboard_static', 'modal'),
            allowNull: false
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
