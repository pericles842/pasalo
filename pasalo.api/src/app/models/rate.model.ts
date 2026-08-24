import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

/**
 * Tabla append-only: cada sync inserta una fila nueva y la tasa "actual"
 * es siempre la ultima (ORDER BY id DESC LIMIT 1).
 */
export class RateModel extends Model<InferAttributes<RateModel>, InferCreationAttributes<RateModel>> {
    declare id: CreationOptional<number>;

    declare oficial: number | null;
    declare paralelo: number | null;
    declare fecha_oficial: string | null;
    declare fecha_paralelo: string | null;
    declare source: CreationOptional<string>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

RateModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        oficial: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        paralelo: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        fecha_oficial: {
            type: DataTypes.STRING,
            allowNull: true
        },
        fecha_paralelo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'dolarapi'
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
        tableName: 'rates',
        timestamps: true
    }
);
