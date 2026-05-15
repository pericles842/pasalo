import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class TestModel extends Model<InferAttributes<TestModel>, InferCreationAttributes<TestModel>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare created_at: CreationOptional<Date>;
}

TestModel.init(
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
        notEmpty: { msg: 'El nombre es requerido' }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'tests',
    timestamps: false
  }
);
