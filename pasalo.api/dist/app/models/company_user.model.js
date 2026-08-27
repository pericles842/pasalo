"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyUserModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
/**
 * Vincula un usuario con la empresa a la que pertenece.
 * El usuario master es el primer registro que se crea al registrar la empresa.
 */
class CompanyUserModel extends sequelize_1.Model {
}
exports.CompanyUserModel = CompanyUserModel;
CompanyUserModel.init({
    uuid: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    company_id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    user_id: {
        type: sequelize_1.DataTypes.UUID,
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
    tableName: 'company_users',
    timestamps: true
});
