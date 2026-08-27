"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const role_model_1 = require("./role.model");
class UserModel extends sequelize_1.Model {
    /** Nunca devolver el hash de la contraseña al frontend */
    toJSON() {
        const { password, ...user } = super.toJSON();
        return user;
    }
}
exports.UserModel = UserModel;
UserModel.init({
    uuid: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    first_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' }
        }
    },
    middle_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    photo_url: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    ci: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'El correo personal no es válido' }
        }
    },
    password: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
    role_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
            model: role_model_1.RoleModel,
            key: 'id'
        }
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'inactive', 'baned'),
        allowNull: false,
        defaultValue: 'active'
    },
    sales_made: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    tableName: 'users',
    timestamps: true
});
UserModel.belongsTo(role_model_1.RoleModel, { foreignKey: 'role_id', as: 'role' });
