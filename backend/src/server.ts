import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import './models/index'; // Ensure models & associations are loaded

// Import routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import materialRoutes from './routes/material.routes';
import printerRoutes from './routes/printer.routes';
import financeRoutes from './routes/finance.routes';
import clientRoutes from './routes/client.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Apply middlewares
const allowedOrigins = ['http://localhost:4200', 'https://saa-s-prod-3d.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Mount API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/clients', clientRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connected successfully.');

    console.log('Syncing database schema (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
