import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Proxy endpoint to serve images and avoid CORS issues
router.get('/proxy-image', asyncHandler(async (req, res) => {
  const { url, fallback } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }

  try {
    console.log('🖼️ Proxying image request:', url.substring(0, 100) + '...');
    
    // Fetch the image from the external service
    const response = await fetch(url, {
      method: 'GET',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'ZetaForge-Backend/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Image service returned ${response.status}: ${response.statusText}`);
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Stream the image back to the client
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    console.log('✅ Successfully proxying image');
    response.body.pipe(res);

  } catch (error) {
    console.error('❌ Error proxying image:', error);
    
    // If there's a fallback URL, try that
    if (fallback && fallback !== url) {
      try {
        console.log('🔄 Trying fallback image:', fallback.substring(0, 100) + '...');
        const fallbackResponse = await fetch(fallback, {
          method: 'GET',
          timeout: 15000,
          headers: {
            'User-Agent': 'ZetaForge-Backend/1.0'
          }
        });

        if (fallbackResponse.ok) {
          const contentType = fallbackResponse.headers.get('content-type') || 'image/png';
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin'
          });
          
          console.log('✅ Successfully using fallback image');
          return fallbackResponse.body.pipe(res);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }

    // Return a placeholder image or error
    res.status(500).json({
      success: false,
      error: 'Failed to load image',
      details: error.message,
      originalUrl: url,
      fallbackUrl: fallback
    });
  }
}));

// Health check for image services
router.get('/image-health', asyncHandler(async (req, res) => {
  const testServices = [
    'https://image.pollinations.ai/prompt/test?width=100&height=100&model=flux',
    'https://image.pollinations.ai/prompt/test?width=100&height=100&model=turbo'
  ];

  const results = await Promise.allSettled(
    testServices.map(async (url) => {
      try {
        const response = await fetch(url, { 
          method: 'HEAD', 
          timeout: 10000 
        });
        return {
          url,
          status: response.status,
          ok: response.ok,
          responseTime: Date.now()
        };
      } catch (error) {
        return {
          url,
          status: 'error',
          ok: false,
          error: error.message
        };
      }
    })
  );

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    services: results.map((result, index) => ({
      service: testServices[index],
      ...result.value
    }))
  });
}));

export default router;
