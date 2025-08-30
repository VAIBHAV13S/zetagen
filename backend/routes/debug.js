import express from 'express';
import { generateImage } from '../services/geminiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Test endpoint to verify prompt cleaning is working
router.post('/test-generation', asyncHandler(async (req, res) => {
  const { prompt = "a beautiful butterfly in space" } = req.body;
  
  try {
    console.log('🧪 Testing prompt generation...');
    console.log('📝 Input prompt:', prompt);
    
    const imageURL = await generateImage(prompt, 'digital-art', 'high');
    console.log('🖼️ Generated image URL:', imageURL);
    
    // Check if URL contains problematic encoding
    const hasBackticks = imageURL.includes('%60%60%60');
    const hasNewlines = imageURL.includes('%0A');
    
    res.json({
      success: true,
      test: {
        inputPrompt: prompt,
        generatedURL: imageURL,
        urlLength: imageURL.length,
        hasProblematicEncoding: hasBackticks,
        hasNewlines: hasNewlines,
        status: hasBackticks ? '❌ Still has backticks' : '✅ Clean URL generated',
        timestamp: new Date().toISOString()
      }
    });
    
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
