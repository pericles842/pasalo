"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissions = exports.ModulePermissions = exports.Module = exports.Role = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
class Role extends sequelize_1.Model {
}
exports.Role = Role;
class Module extends sequelize_1.Model {
}
exports.Module = Module;
class ModulePermissions extends sequelize_1.Model {
}
exports.ModulePermissions = ModulePermissions;
/**
 * Clase para los permisos y roles
 *
 * @export
 * @class ChargesUsers
 */
class UserPermissions {
    constructor() {
        this.role = new Role();
        this.module = new Module();
        this.modulePermissions = new ModulePermissions();
    }
    /**
     *Obtiene los permisos de un usuario
     *
     * @static
     * @param {number} id_user
     * @return {*}
     * @memberof UserPermissions
     */
    static async getUserPermission(id_user) {
        let permissions = await db_1.sequelize.query(`select 
        users.id as id_user,
        module_permissions.role_id,
        roles.name as rol,
        module_permissions.module_id,
        modules.name as module,
        module_permissions.can_view,
        module_permissions.can_create,
        module_permissions.can_update,
        module_permissions.can_delete
        from users
        INNER JOIN module_permissions ON module_permissions.role_id = users.rol_id
        INNER JOIN roles on roles.id = module_permissions.role_id
        INNER JOIN modules on modules.id = module_permissions.module_id
        WHERE users.id  = :id_user`, {
            replacements: { id_user },
            type: sequelize_1.QueryTypes.SELECT,
        });
        return permissions.map((p) => {
            p.can_view = !!p.can_view;
            p.can_create = !!p.can_create;
            p.can_update = !!p.can_update;
            p.can_delete = !!p.can_delete;
            return p;
        });
    }
}
exports.UserPermissions = UserPermissions;
Role.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: "roles",
    timestamps: false,
});
Module.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: "modules",
    timestamps: false,
});
ModulePermissions.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    role_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    module_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    can_view: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_create: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_update: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    can_delete: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: "module_permissions",
    timestamps: false,
});
