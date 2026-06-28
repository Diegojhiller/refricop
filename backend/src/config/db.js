import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // Desactivar log de SQL para consola limpia
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL 연결! (Database connected successfully)');
  } catch (error) {
    if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
      console.warn(`WARNING: La base de datos '${process.env.DB_NAME}' no existe. Por favor creala localmente en tu gestor MySQL usando: CREATE DATABASE ${process.env.DB_NAME};`);
    } else {
      console.error('No se pudo conectar a la base de datos:', error);
    }
  }
};

export { sequelize, connectDB };
