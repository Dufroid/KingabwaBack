import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import nomineeRoutes from './routes/nominee.routes.js';
import voteRoutes from './routes/vote.routes.js';
import blogRoutes from './routes/blog.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import winnerRoutes from './routes/winner.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger API Documentation JSON Route
app.get('/api-docs', (req, res) => {
  res.json(swaggerSpec);
});

// Base Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Kingabwa Awards REST API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Register
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/nominees', nomineeRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/hall-of-fame', winnerRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Database & Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 KINGABWA AWARDS SERVER RUNNING ON PORT: ${PORT}`);
    console.log(`📖 API Documentation available at: http://localhost:${PORT}/api-docs`);
    console.log(`==================================================`);
  });
};

startServer();
