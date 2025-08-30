import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import Asset from '../models/Asset.js';
import { generateImage, generateMetadata } from '../services/geminiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/generate-asset
router.post('/generate-asset', asyncHandler(async (req, res) => {
  const { prompt, walletAddress, style = 'digital-art', quality = 'high', assetType = 'artwork' } = req.body;

  console.log('🔧 Generate Asset Request:', {
    prompt: prompt?.substring(0, 50) + '...',
    walletAddress,
    style,
    quality,
    assetType,
    bodyKeys: Object.keys(req.body)
  });

  // Enhanced validation with detailed error messages
  if (!prompt || !walletAddress) {
    const error = {
      success: false,
      error: 'Prompt and wallet address are required',
      details: {
        promptProvided: !!prompt,
        walletAddressProvided: !!walletAddress,
        received: { prompt: prompt?.substring(0, 20), walletAddress }
      }
    };
    console.error('❌ Validation failed:', error);
    return res.status(400).json(error);
  }

  if (!ethers.isAddress(walletAddress)) {
    const error = {
      success: false,
      error: 'Invalid wallet address format',
      details: { receivedAddress: walletAddress }
    };
    console.error('❌ Invalid wallet address:', error);
    return res.status(400).json(error);
  }

  if (prompt.length < 5) {
    const error = {
      success: false,
      error: 'Prompt too short (minimum 5 characters)',
      details: { promptLength: prompt.length, prompt: prompt.substring(0, 50) }
    };
    console.error('❌ Prompt too short:', error);
    return res.status(400).json(error);
  }

  if (prompt.length > 1000) {
    const error = {
      success: false,
      error: 'Prompt too long (max 1000 characters)',
      details: { promptLength: prompt.length }
    };
    console.error('❌ Prompt too long:', error);
    return res.status(400).json(error);
  }

  console.log('✅ Validation passed, starting generation...');

  // Generate unique asset ID
  const assetId = uuidv4();
  const startTime = Date.now();

  try {
    // AI-powered generation with enhanced parameters
    console.log('🤖 Starting AI generation...');
    const [imageURL, aiMetadata] = await Promise.all([
      generateImage(prompt, style, quality),
      generateMetadata(prompt, assetType)
    ]);
    console.log('✅ AI generation completed successfully');

    const generationTime = Date.now() - startTime;

  // Enhanced asset metadata with AI-generated traits
  const metadata = {
    name: aiMetadata.name || `AI Asset ${assetId.slice(0, 8)}`,
    description: aiMetadata.description || prompt,
    traits: aiMetadata.traits || [],
    createdAt: new Date(),
    transactionHash: null,
    tokenId: null,
    aiGenerated: true,
    generationModel: 'gemini-2.0-flash-exp',
    promptHash: ethers.keccak256(ethers.toUtf8Bytes(prompt)),
    rarity: aiMetadata.rarity || 'common'
  };

  // Enhanced generation parameters
  const generationParameters = {
    style,
    quality,
    assetType,
    size: '1024x1024',
    model: 'gemini-2.0-flash-exp',
    generationTime: `${generationTime}ms`,
    promptTokens: prompt.split(' ').length,
    enhancedFeatures: ['ai-metadata', 'trait-generation', 'smart-caching']
  };

  // Create new asset
  const newAsset = new Asset({
    assetId,
    prompt,
    metadata,
    imageURL,
    ownerAddress: walletAddress.toLowerCase(),
    mintTxHash: null,
    isMinted: false,
    generationParameters
  });

  // Save to database
  await newAsset.save();

  // Enhanced response with generation insights
  res.status(201).json({
    success: true,
    asset: {
      assetId: newAsset.assetId,
      prompt: newAsset.prompt,
      imageUrl: newAsset.imageURL,
      owner: newAsset.ownerAddress,
      metadata: newAsset.metadata,
      isMinted: newAsset.isMinted,
      generationParameters: newAsset.generationParameters
    },
    generation: {
      executionTime: `${generationTime}ms`,
      cacheHit: generationTime < 1000,
      promptAnalysis: {
        length: prompt.length,
        words: prompt.split(' ').length,
        complexity: prompt.split(' ').length > 10 ? 'complex' : 'simple',
        style: style,
        quality: quality
      },
      aiInsights: {
        estimatedRarity: metadata.rarity,
        traitCount: metadata.traits.length,
        category: assetType
      }
    }
  });

  } catch (error) {
    console.error('❌ Generation failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Asset generation failed',
      details: error.message,
      stage: error.stage || 'unknown'
    });
  }
}));

/**
 * @route POST /api/generate-batch
 * @desc Generate multiple assets with different styles
 */
router.post('/generate-batch', asyncHandler(async (req, res) => {
  const { prompts, walletAddress, styles = ['digital-art'], quality = 'high' } = req.body;

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Prompts array is required and cannot be empty'
    });
  }

  if (prompts.length > 5) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 5 prompts allowed per batch'
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address format'
    });
  }

  const startTime = Date.now();
  const results = [];
  const errors = [];

  // Process prompts in parallel with different styles
  for (let i = 0; i < prompts.length; i++) {
    try {
      const prompt = prompts[i];
      const style = styles[i % styles.length]; // Cycle through styles
      const assetId = uuidv4();

      const [imageURL, aiMetadata] = await Promise.all([
        generateImage(prompt, style, quality),
        generateMetadata(prompt, 'artwork')
      ]);

      const metadata = {
        name: aiMetadata.name || `AI Asset ${assetId.slice(0, 8)}`,
        description: aiMetadata.description || prompt,
        traits: aiMetadata.traits || [],
        createdAt: new Date(),
        transactionHash: null,
        tokenId: null,
        aiGenerated: true,
        generationModel: 'gemini-2.0-flash-exp',
        promptHash: ethers.keccak256(ethers.toUtf8Bytes(prompt)),
        batchIndex: i
      };

      const newAsset = new Asset({
        assetId,
        prompt,
        metadata,
        imageURL,
        ownerAddress: walletAddress.toLowerCase(),
        mintTxHash: null,
        isMinted: false,
        generationParameters: {
          style,
          quality,
          size: '1024x1024',
          model: 'gemini-2.0-flash-exp',
          batchGeneration: true,
          batchIndex: i
        }
      });

      await newAsset.save();
      results.push({
        assetId,
        prompt,
        imageUrl: imageURL,
        style,
        metadata: newAsset.metadata
      });

    } catch (error) {
      errors.push({
        prompt: prompts[i],
        error: error.message,
        index: i
      });
    }
  }

  const executionTime = Date.now() - startTime;

  res.json({
    success: true,
    data: {
      assets: results,
      errors,
      summary: {
        totalRequested: prompts.length,
        successful: results.length,
        failed: errors.length,
        executionTime: `${executionTime}ms`,
        averageTimePerAsset: `${Math.round(executionTime / prompts.length)}ms`
      }
    }
  });
}));

/**
 * @route POST /api/generate-variations
 * @desc Generate variations of an existing prompt with different styles
 */
router.post('/generate-variations', asyncHandler(async (req, res) => {
  const { basePrompt, walletAddress, variationCount = 3, styles } = req.body;

  if (!basePrompt || !walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'Base prompt and wallet address are required'
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address format'
    });
  }

  const targetStyles = styles || ['digital-art', 'photorealistic', 'anime', 'abstract', 'cyberpunk'];
  const selectedStyles = targetStyles.slice(0, Math.min(variationCount, 5));

  const startTime = Date.now();
  const variations = [];

  for (let i = 0; i < selectedStyles.length; i++) {
    try {
      const style = selectedStyles[i];
      const enhancedPrompt = `${basePrompt}, ${style} style`;
      const assetId = uuidv4();

      const [imageURL, aiMetadata] = await Promise.all([
        generateImage(enhancedPrompt, style, 'high'),
        generateMetadata(enhancedPrompt, 'artwork')
      ]);

      const metadata = {
        name: `${aiMetadata.name || 'AI Variation'} (${style})`,
        description: aiMetadata.description || enhancedPrompt,
        traits: [...(aiMetadata.traits || []), { type: 'Style', value: style }],
        createdAt: new Date(),
        isVariation: true,
        basePrompt,
        variationStyle: style,
        variationIndex: i
      };

      const newAsset = new Asset({
        assetId,
        prompt: enhancedPrompt,
        metadata,
        imageURL,
        ownerAddress: walletAddress.toLowerCase(),
        mintTxHash: null,
        isMinted: false,
        generationParameters: {
          style,
          quality: 'high',
          size: '1024x1024',
          model: 'gemini-2.0-flash-exp',
          isVariation: true,
          basePrompt,
          variationIndex: i
        }
      });

      await newAsset.save();
      variations.push({
        assetId,
        style,
        imageUrl: imageURL,
        metadata: newAsset.metadata,
        prompt: enhancedPrompt
      });

    } catch (error) {
      console.error(`Error generating variation ${i}:`, error);
    }
  }

  const executionTime = Date.now() - startTime;

  res.json({
    success: true,
    data: {
      basePrompt,
      variations,
      summary: {
        variationsGenerated: variations.length,
        stylesUsed: selectedStyles,
        executionTime: `${executionTime}ms`,
        owner: walletAddress
      }
    }
  });
}));

export default router;
