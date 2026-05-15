"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicGroupsModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
class PublicGroupsModel extends sequelize_1.Model {
}
exports.PublicGroupsModel = PublicGroupsModel;
PublicGroupsModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre del grupo es requerido" },
        },
    },
    rif: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El correo es requerido" },
        },
    },
    url_img: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: "public_groups",
    timestamps: false,
});
