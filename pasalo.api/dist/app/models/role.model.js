"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissions = exports.RoleModel = exports.ROLE_ADMIN_SLUG = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
/** El usuario master de una empresa siempre nace con este rol */
exports.ROLE_ADMIN_SLUG = 'admin';
class RoleModel extends sequelize_1.Model {
    /**
     * Devuelve el rol por su slug. La permisología por módulo se define más adelante.
     *
     * @static
     * @param {RoleSlug} slug
     * @memberof RoleModel
     */
    static async findBySlug(slug) {
        return await RoleModel.findOne({ where: { slug } });
    }
}
exports.RoleModel = RoleModel;
/**
 * TODO: la permisología por módulo aún no está modelada en la base de datos.
 * Este stub solo existe para que authMiddleware compile; no otorga ni deniega nada real todavía.
 */
class UserPermissions {
    static async getUserPermission(user_id) {
        return [];
    }
}
exports.UserPermissions = UserPermissions;
RoleModel.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del rol es requerido' }
        }
    },
    slug: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    description: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
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
    tableName: 'roles',
    timestamps: true
});
