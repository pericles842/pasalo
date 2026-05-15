"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
class Usuario extends sequelize_1.Model {
    static async getUsers(id = null) {
        try {
            let query = `SELECT 
      users.*,
      public_groups.name as savings_box ,
      states.name as state ,
      cities.name as municipality ,
      parishes.name as parish,
      roles.name as role
      FROM users 
      LEFT JOIN public_groups on public_groups.id = users.public_group_id
      INNER JOIN states ON states.id = users.state_id
      INNER JOIN cities ON cities.id = users.city_id
      INNER JOIN parishes ON parishes.id = users.parish_id
      INNER JOIN roles ON roles.id = users.rol_id `;
            if (id) {
                query += ` WHERE users.id = ${id};`;
            }
            const [users] = await db_1.sequelize.query(query);
            return users;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.Usuario = Usuario;
Usuario.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    last_name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El correo no puede estar vació" },
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El teléfono no puede estar vacío" },
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "La contraseña no puede estar vacía" },
        },
    },
    ci: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "La cédula no puede estar vacía" },
        },
    },
    url_img: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    rol_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    public_group_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    state_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    city_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    parish_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: "users",
    timestamps: false,
});
