import express from 'express';
import { suggestPrompts } from '../services/geminiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/suggest - Get AI prompt suggestions with enhanced features
router.post('/suggest', asyncHandler(async (req, res) => {
  const { partialPrompt = '', category = 'general', count = 5, creativity = 'balanced' } = req.body;

  if (count > 20) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 20 suggestions allowed per request'
    });
  }

  const startTime = Date.now();
  const suggestions = await suggestPrompts(
    partialPrompt || 'creative art', 
    category, 
    Math.min(count, 20)
  );
  const executionTime = Date.now() - startTime;

  // Enhance suggestions with metadata
  const enhancedSuggestions = suggestions.map((prompt, index) => ({
    id: index + 1,
    prompt,
    category,
    complexity: prompt.split(' ').length > 8 ? 'complex' : 'simple',
    estimatedGenerationTime: prompt.length > 100 ? 'slow' : 'fast',
    suggestedStyles: getSuggestedStyles(prompt, category),
    popularity: Math.floor(Math.random() * 100) + 1
  }));

  res.json({
    success: true,
    prompts: enhancedSuggestions,
    metadata: {
      basedOn: partialPrompt || 'random',
      category,
      requestedCount: count,
      returnedCount: suggestions.length,
      executionTime: `${executionTime}ms`,
      cacheHit: executionTime < 500,
      creativity
    }
  });
}));

// Helper function to suggest styles based on prompt content
function getSuggestedStyles(prompt, category) {
  const styleMap = {
    fantasy: ['digital-art', 'anime', 'abstract'],
    scifi: ['cyberpunk', 'digital-art', 'photorealistic'],
    nature: ['photorealistic', 'digital-art', 'impressionist'],
    portrait: ['photorealistic', 'anime', 'digital-art'],
    abstract: ['abstract', 'digital-art', 'surreal'],
    general: ['digital-art', 'photorealistic', 'anime']
  };

  const baseStyles = styleMap[category] || styleMap.general;
  
  // Add context-specific styles based on prompt keywords
  if (prompt.includes('robot') || prompt.includes('cyber')) {
    baseStyles.unshift('cyberpunk');
  }
  if (prompt.includes('anime') || prompt.includes('manga')) {
    baseStyles.unshift('anime');
  }
  if (prompt.includes('photo') || prompt.includes('realistic')) {
    baseStyles.unshift('photorealistic');
  }

  return [...new Set(baseStyles)].slice(0, 3);
}

// Mock data for categories and trending
const promptCategories = {
  fantasy: 10,
  scifi: 10,
  nature: 10,
  abstract: 10,
  portrait: 10
};

const trendingStyles = [
  'cyberpunk aesthetic',
  'vaporwave style',
  'studio ghibli inspired',
  'hyper-realistic portrait',
  'digital art masterpiece',
  'neon-lit cityscape',
  'ethereal fantasy landscape',
  'minimalist design',
  'retro futuristic',
  'dark academia aesthetic'
];

// GET /api/suggest/categories - Get available prompt categories
router.get('/suggest/categories', (req, res) => {
  const categories = Object.keys(promptCategories).map(category => ({
    name: category,
    displayName: category.charAt(0).toUpperCase() + category.slice(1),
    count: promptCategories[category]
  }));

  res.json({
    success: true,
    categories,
    totalPrompts: Object.values(promptCategories).reduce((sum, count) => sum + count, 0)
  });
});

// GET /api/suggest/trending - Get trending prompt styles
router.get('/suggest/trending', (req, res) => {
  const trending = trendingStyles.map((style, index) => ({
    style,
    popularity: Math.floor(Math.random() * 1000) + 500,
    rank: index + 1
  })).sort((a, b) => b.popularity - a.popularity);

  res.json({
    success: true,
    trending: trending.slice(0, 10),
    lastUpdated: new Date().toISOString()
  });
});

export default router;
