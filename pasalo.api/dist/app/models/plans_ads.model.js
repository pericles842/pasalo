"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAdsModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const ad_location_model_1 = require("./ad_location.model");
const plan_ads_location_model_1 = require("./plan_ads_location.model");
// Catalogo de planes de publicidad (distinto de PlanModel, que es el plan de suscripcion de Pasalo).
// Un plan ya no tiene un placement fijo: incluye una o mas `AdLocationModel` via `plan_ads_locations`
// (ver `locations` mas abajo), lo que permite vender combos (ej. header + footer del menu) y agregar
// ubicaciones nuevas sin tocar esquema ni codigo.
class PlanAdsModel extends sequelize_1.Model {
}
exports.PlanAdsModel = PlanAdsModel;
PlanAdsModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del plan de publicidad es requerido' }
        }
    },
    priority: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1,
            max: 10
        }
    },
    price: {
        type: sequelize_1.DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            isNumeric: { msg: 'El precio debe ser un número válido' }
        }
    },
    duration_days: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
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
    tableName: 'plans_ads',
    timestamps: true
});
PlanAdsModel.belongsToMany(ad_location_model_1.AdLocationModel, {
    through: plan_ads_location_model_1.PlanAdsLocationModel,
    foreignKey: 'plan_ads_id',
    otherKey: 'ad_location_id',
    as: 'locations'
});
ad_location_model_1.AdLocationModel.belongsToMany(PlanAdsModel, {
    through: plan_ads_location_model_1.PlanAdsLocationModel,
    foreignKey: 'ad_location_id',
    otherKey: 'plan_ads_id',
    as: 'plans'
});
