import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// GET /api/debug/status - Get comprehensive backend status
router.get('/debug/status', asyncHandler(async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    backend: {
      status: 'running',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    },
    configuration: {
      zetaChainRPC: process.env.ZETACHAIN_RPC_URL ? 'configured' : 'missing',
      privateKey: process.env.ZETACHAIN_PRIVATE_KEY ? 'configured' : 'missing',
      universalContract: process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS ? 'configured' : 'missing',
      legacyContract: process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS ? 'configured' : 'missing',
      mongodb: process.env.MONGODB_URI ? 'configured' : 'missing',
      googleAI: process.env.GOOGLE_AI_API_KEY ? 'configured' : 'missing'
    },
    services: {
      database: 'unknown', // Will be updated if database connection is available
      blockchain: 'unknown', // Will be updated if blockchain connection is available
      imageGeneration: 'unknown' // Will be updated if AI service is available
    },
    recommendations: []
  };

  // Check database connection
  try {
    const mongoose = await import('mongoose');
    if (mongoose.connection.readyState === 1) {
      status.services.database = 'connected';
    } else {
      status.services.database = 'disconnected';
      status.recommendations.push('Check MongoDB connection and MONGODB_URI environment variable');
    }
  } catch (error) {
    status.services.database = 'error';
    status.recommendations.push('MongoDB not available: ' + error.message);
  }

  // Check blockchain service
  try {
    const { ethers } = await import('ethers');
    if (process.env.ZETACHAIN_RPC_URL && process.env.ZETACHAIN_PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider(process.env.ZETACHAIN_RPC_URL);
      await provider.getNetwork();
      status.services.blockchain = 'connected';
    } else {
      status.services.blockchain = 'not_configured';
      status.recommendations.push('Set ZETACHAIN_RPC_URL and ZETACHAIN_PRIVATE_KEY environment variables');
    }
  } catch (error) {
    status.services.blockchain = 'error';
    status.recommendations.push('Blockchain service error: ' + error.message);
  }

  // Check image generation service
  if (process.env.GOOGLE_AI_API_KEY) {
    status.services.imageGeneration = 'configured';
  } else {
    status.services.imageGeneration = 'not_configured';
    status.recommendations.push('Set GOOGLE_AI_API_KEY for AI image generation');
  }

  // Add configuration recommendations
  if (!process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS) {
    status.recommendations.push('Deploy Universal V2 contract and set ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS');
  }

  if (!process.env.MONGODB_URI) {
    status.recommendations.push('Set up MongoDB database and configure MONGODB_URI');
  }

  res.json({
    success: true,
    status,
    message: 'Backend status check completed'
  });
}));

// GET /api/debug/config - Get configuration summary (without sensitive data)
router.get('/debug/config', asyncHandler(async (req, res) => {
  const config = {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    cors: {
      allowedOrigins: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://zetaforge-universal-app-v2.vercel.app'] 
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    },
    features: {
      universalMode: process.env.UNIVERSAL_MODE_ENABLED === 'true',
      crossChain: process.env.CROSS_CHAIN_ENABLED === 'true'
    },
    services: {
      database: !!process.env.MONGODB_URI,
      blockchain: !!(process.env.ZETACHAIN_RPC_URL && process.env.ZETACHAIN_PRIVATE_KEY),
      contracts: !!(process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS && process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS),
      ai: !!process.env.GOOGLE_AI_API_KEY
    }
  };

  res.json({
    success: true,
    config,
    message: 'Configuration summary retrieved'
  });
}));

// GET /api/debug/test-mint - Test minting service (without actual minting)
router.get('/debug/test-mint', asyncHandler(async (req, res) => {
  try {
    // Test if minting service can be initialized
    const { crossChainMintAsset } = await import('../services/zetaForgeUniversalService.js');
    
    res.json({
      success: true,
      message: 'Minting service is available',
      test: 'Service import successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Minting service test failed',
      details: error.message,
      recommendations: [
        'Check environment variables: ZETACHAIN_RPC_URL, ZETACHAIN_PRIVATE_KEY, ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS',
        'Ensure contracts are deployed and addresses are correct',
        'Verify ZetaChain RPC endpoint is accessible'
      ]
    });
  }
}));

export default router;
