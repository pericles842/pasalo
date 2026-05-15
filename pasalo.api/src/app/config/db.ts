import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

//conexion con sequelize
export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    dialectModule: require("mysql2"),
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // 60 segs
      idle: 10000,
    },
  }
);
