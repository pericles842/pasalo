import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

// Tabla puente N:M entre `plans_ads` y `ad_locations`: que ubicaciones trae cada plan.
export class PlanAdsLocationModel extends Model<InferAttributes<PlanAdsLocationModel>, InferCreationAttributes<PlanAdsLocationModel>> {
    declare id: CreationOptional<number>;

    declare plan_ads_id: number;
    declare ad_location_id: number;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

PlanAdsLocationModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        plan_ads_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ad_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        tableName: 'plan_ads_locations',
        timestamps: true
    }
);
