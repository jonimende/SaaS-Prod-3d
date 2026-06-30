import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/produccion3d';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    // Add SSL or other PostgreSQL specific settings here if needed in production
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
