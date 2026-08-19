import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

/**
 * Vincula un usuario con la empresa a la que pertenece.
 * El usuario master es el primer registro que se crea al registrar la empresa.
 */
export class CompanyUserModel extends Model<InferAttributes<CompanyUserModel>, InferCreationAttributes<CompanyUserModel>> {
    declare uuid: CreationOptional<string>;

    declare company_id: string;
    declare user_id: string;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

CompanyUserModel.init(
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true
        },
        company_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
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
        tableName: 'company_users',
        timestamps: true
    }
);
