"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAdsLocationModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
// Tabla puente N:M entre `plans_ads` y `ad_locations`: que ubicaciones trae cada plan.
class PlanAdsLocationModel extends sequelize_1.Model {
}
exports.PlanAdsLocationModel = PlanAdsLocationModel;
PlanAdsLocationModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    plan_ads_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    ad_location_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
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
    tableName: 'plan_ads_locations',
    timestamps: true
});
