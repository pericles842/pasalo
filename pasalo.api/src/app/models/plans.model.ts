import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class PlanModel extends Model<InferAttributes<PlanModel>, InferCreationAttributes<PlanModel>> {
    // El ID es numérico y autoincremental, por lo que es opcional al crear un registro
    declare id: CreationOptional<number>;

    // Campos obligatorios
    declare name: string;
    declare description: string;
    declare price: number; // En TypeScript, DOUBLE se maneja como number
    declare color_theme: string;

    // Campo con valor por defecto en la migración
    declare user_limit: CreationOptional<number>;

    // Timestamps automáticos mapeados para evitar errores de tipo
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

PlanModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El nombre del plan es requerido' }
            }
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'La descripción es requerida' }
            }
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: {
                isNumeric: { msg: 'El precio debe ser un número válido' }
            }
        },
        user_limit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        color_theme: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'El tema de color es requerido' }
            }
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
        tableName: 'plans',
        timestamps: true
    }
);