import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Middleware
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://www.earthassociation.in',
    'https://earthassociation.in'
  ], 
  credentials: true 
}));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/verify', verifyRoutes);

// Root
app.get('/', (req, res) => {
  res.send('NGO Verification API is running...');
});

// Error handling
app.use(errorHandler);

export default app;
