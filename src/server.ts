import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
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
import paymentRoutes from './routes/payment.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  try {
    const hostname = new URL(normalizedOrigin).hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.onrender.com') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.railway.app') ||
      hostname.endsWith('.fly.dev')
    );
  } catch {
    return false;
  }
};

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsBasePath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsBasePath));

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
app.use('/api/payments', paymentRoutes);
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
