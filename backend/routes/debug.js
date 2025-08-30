import express from 'express';
import { generateImage } from '../services/geminiService.js';
import imageStorageService from '../services/imageStorageService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Test endpoint to verify new image generation system
router.post('/test-generation', asyncHandler(async (req, res) => {
  const { prompt = "a beautiful butterfly in space" } = req.body;
  
  try {
    console.log('🧪 Testing new image generation system...');
    console.log('📝 Input prompt:', prompt);
    
    const imageResult = await generateImage(prompt, 'digital-art', 'high');
    console.log('🖼️ Generated image result:', {
      type: typeof imageResult,
      hasImageURL: !!imageResult.imageURL,
      generator: imageResult.generator,
      format: imageResult.format
    });
    
    let processedResult = {
      success: true,
      inputPrompt: prompt,
      generationResult: imageResult,
      analysis: {
        isString: typeof imageResult === 'string',
        hasImageURL: !!imageResult.imageURL,
        generator: imageResult.generator || 'Unknown',
        format: imageResult.format || 'url',
        timestamp: new Date().toISOString()
      }
    };

    // If it's a base64 image, try to save it
    if (imageResult.format === 'base64' && imageResult.imageURL.startsWith('data:')) {
      try {
        const testAssetId = 'test-' + Date.now();
        const fileURL = await imageStorageService.saveBase64Image(imageResult.imageURL, testAssetId);
        processedResult.fileStorage = {
          success: true,
          fileURL: fileURL,
          fullURL: `${process.env.BASE_URL || 'http://localhost:5000'}${fileURL}`
        };
      } catch (storageError) {
        processedResult.fileStorage = {
          success: false,
          error: storageError.message
        };
      }
    }

    res.json(processedResult);
    
  } catch (error) {
    console.error('❌ Test generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      test: {
        status: '❌ Generation failed',
        timestamp: new Date().toISOString()
      }
    });
  }
}));

export default router;
