"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
class PlanModel extends sequelize_1.Model {
}
exports.PlanModel = PlanModel;
PlanModel.init({
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
            notEmpty: { msg: 'El nombre del plan es requerido' }
        }
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La descripción es requerida' }
        }
    },
    price: {
        type: sequelize_1.DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            isNumeric: { msg: 'El precio debe ser un número válido' }
        }
    },
    user_limit: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    payment_methods_limit: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3
    },
    color_theme: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tema de color es requerido' }
        }
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
    tableName: 'plans',
    timestamps: true
});
