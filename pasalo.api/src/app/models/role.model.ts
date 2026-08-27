import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

/** Slugs de roles disponibles en Pásalo */
export type RoleSlug = 'admin' | 'support' | 'seller';

/** El usuario master de una empresa siempre nace con este rol */
export const ROLE_ADMIN_SLUG: RoleSlug = 'admin';

export class RoleModel extends Model<InferAttributes<RoleModel>, InferCreationAttributes<RoleModel>> {
    declare id: CreationOptional<number>;

    declare name: string;
    declare slug: RoleSlug;
    declare description: string | null;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    /**
     * Devuelve el rol por su slug. La permisología por módulo se define más adelante.
     *
     * @static
     * @param {RoleSlug} slug
     * @memberof RoleModel
     */
    static async findBySlug(slug: RoleSlug) {
        return await RoleModel.findOne({ where: { slug } });
    }
}

/** Permiso de un usuario sobre un módulo del sistema */
export interface ModulePermission {
    module_id: number;
    module: string;
    can_view: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
}

/**
 * TODO: la permisología por módulo aún no está modelada en la base de datos.
 * Este stub solo existe para que authMiddleware compile; no otorga ni deniega nada real todavía.
 */
export class UserPermissions {
    static async getUserPermission(user_id: string): Promise<ModulePermission[]> {
        return [];
    }
}

RoleModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre del rol es requerido' }
            }
        },
        slug: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
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
        tableName: 'roles',
        timestamps: true
    }
);
