"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
/**
 * Tabla append-only: cada sync inserta una fila nueva y la tasa "actual"
 * es siempre la ultima (ORDER BY id DESC LIMIT 1).
 */
class RateModel extends sequelize_1.Model {
}
exports.RateModel = RateModel;
RateModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    oficial: {
        type: sequelize_1.DataTypes.DOUBLE,
        allowNull: true
    },
    paralelo: {
        type: sequelize_1.DataTypes.DOUBLE,
        allowNull: true
    },
    fecha_oficial: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    fecha_paralelo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    source: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'dolarapi'
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
    tableName: 'rates',
    timestamps: true
});
