"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdLocationModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
// Catalogo de ubicaciones de publicidad disponibles en la plataforma. Un plan
// de publicidad (`PlanAdsModel`) incluye una o mas de estas via `plan_ads_locations`.
class AdLocationModel extends sequelize_1.Model {
}
exports.AdLocationModel = AdLocationModel;
AdLocationModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    key: {
        type: sequelize_1.DataTypes.STRING(100),
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
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre de la ubicación es requerido' }
        }
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
    tableName: 'ads_locations',
    timestamps: true
});
