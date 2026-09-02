import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { RoleModel } from './role.model';

export type UserStatus = 'active' | 'inactive' | 'baned';

export class UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>> {
    declare uuid: CreationOptional<string>;

    declare first_name: string;
    declare middle_name: string | null;
    declare photo_url: CreationOptional<string | null>;
    declare ci: CreationOptional<string | null>;
    declare email: string;
    declare password: string | null;
    /** Id de la cuenta de Google vinculada (login con Google, ver AuthController.google) */
    declare google_id: CreationOptional<string | null>;
    declare role_id: CreationOptional<number>;
    declare status: CreationOptional<UserStatus>;
    /** Casos de exito / ventas realizadas del usuario */
    declare sales_made: CreationOptional<number>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    /**
     * Nunca devolver el hash de la contraseña al frontend; en su lugar va
     * has_password, para que el perfil sepa si pedir "contraseña actual" o
     * dejar que el usuario agregue una por primera vez (cuentas creadas solo
     * por Google no tienen, ver AuthController.updateMe).
     */
    toJSON() {
        const { password, ...user } = super.toJSON() as InferAttributes<UserModel>;
        return { ...user, has_password: password !== null };
    }
}

/** Atributos planos del usuario (usado por el JWT y las respuestas) */
export type Usuario = InferAttributes<UserModel>;

UserModel.init(
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        first_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre es requerido' }
            }
        },
        middle_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        photo_url: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        ci: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: 'El correo personal no es válido' }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        google_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            references: {
                model: RoleModel,
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'baned'),
            allowNull: false,
            defaultValue: 'active'
        },
        sales_made: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true
    }
);

UserModel.belongsTo(RoleModel, { foreignKey: 'role_id', as: 'role' });
