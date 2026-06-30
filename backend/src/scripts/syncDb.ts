import sequelize from '../config/database';
import '../models/index'; // Import models to ensure associations are registered

async function syncDb() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Syncing database schema (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync database:', error);
    process.exit(1);
  }
}

syncDb();
