import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { generalLimiter, generateLimiter, mintLimiter, suggestLimiter } from './middleware/rateLimiter.js';

// Import routes
import generateRoutes from './routes/generate.js';
import assetsRoutes from './routes/assets.js';
import mintRoutes from './routes/mint.js';
import suggestRoutes from './routes/suggest.js';
import universalRoutes from './routes/universal.js';
import debugRoutes from './routes/debug.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://zetaforge-universal-app-v2.vercel.app', /\.vercel\.app$/] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Debug CORS configuration
console.log('🔒 CORS Configuration:', {
  environment: process.env.NODE_ENV,
  allowedOrigins: corsOptions.origin,
  frontendUrl: process.env.FRONTEND_URL
});

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Zeta-Gen Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes with specific rate limiters
app.use('/api', generateLimiter, generateRoutes);
app.use('/api', assetsRoutes);
app.use('/api', mintLimiter, mintRoutes);
app.use('/api', suggestLimiter, suggestRoutes);
app.use('/api/universal', universalRoutes);
app.use('/api/debug', debugRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Zeta-Gen API v1.0.0',
    endpoints: {
      generate: 'POST /api/generate-asset',
      assets: {
        all: 'GET /api/assets',
        byOwner: 'GET /api/assets/:owner',
        minted: 'GET /api/assets/minted'
      },
      mint: {
        single: 'POST /api/mint',
        status: 'GET /api/mint/status/:assetId',
        batch: 'POST /api/mint/batch'
      },
      suggest: {
        prompts: 'POST /api/suggest',
        categories: 'GET /api/suggest/categories',
        trending: 'GET /api/suggest/trending'
      }
    },
    documentation: 'https://docs.zeta-gen.ai/api',
    support: 'support@zeta-gen.ai'
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zeta-Gen Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
