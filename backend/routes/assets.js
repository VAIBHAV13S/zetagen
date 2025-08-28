import express from 'express';
import Asset from '../models/Asset.js';

const router = express.Router();

// GET /api/assets - Get all assets
router.get('/assets', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    // Validate pagination parameters
    if (pageNumber < 1 || limitNumber < 1 || limitNumber > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    // Get total count for pagination
    const totalAssets = await Asset.countDocuments();

    // Fetch assets with pagination
    const assets = await Asset.find()
      .sort(sortObj)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    // Format response
    const formattedAssets = assets.map(asset => ({
      id: asset.assetId,
      prompt: asset.prompt,
      imageUrl: asset.imageURL,
      owner: asset.ownerAddress,
      metadata: {
        name: asset.metadata.name,
        description: asset.metadata.description,
        createdAt: asset.metadata.createdAt,
        transactionHash: asset.metadata.transactionHash,
        tokenId: asset.metadata.tokenId
      },
      isMinted: asset.isMinted,
      createdAt: asset.createdAt,
      transactionHash: asset.mintTxHash
    }));

    res.json({
      success: true,
      assets: formattedAssets,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalAssets,
        pages: Math.ceil(totalAssets / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching assets'
    });
  }
});

// GET /api/assets/:owner - Get assets by owner
router.get('/assets/:owner', async (req, res) => {
  try {
    const { owner } = req.params;
    const { page = 1, limit = 20, includeUnminted = 'true' } = req.query;

    // Validate wallet address format (basic check)
    if (!owner || owner.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Build query
    const query = { ownerAddress: owner.toLowerCase() };
    
    // Option to filter only minted assets
    if (includeUnminted === 'false') {
      query.isMinted = true;
    }

    // Get total count
    const totalAssets = await Asset.countDocuments(query);

    // Fetch assets
    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    // Format response
    const formattedAssets = assets.map(asset => ({
      id: asset.assetId,
      prompt: asset.prompt,
      imageUrl: asset.imageURL,
      owner: asset.ownerAddress,
      metadata: {
        name: asset.metadata.name,
        description: asset.metadata.description,
        createdAt: asset.metadata.createdAt,
        transactionHash: asset.metadata.transactionHash,
        tokenId: asset.metadata.tokenId
      },
      isMinted: asset.isMinted,
      createdAt: asset.createdAt,
      transactionHash: asset.mintTxHash
    }));

    res.json({
      success: true,
      assets: formattedAssets,
      owner: owner.toLowerCase(),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalAssets,
        pages: Math.ceil(totalAssets / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get assets by owner error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching owner assets'
    });
  }
});

// GET /api/assets/minted - Get all minted assets
router.get('/assets/minted', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const totalMinted = await Asset.countDocuments({ isMinted: true });

    const mintedAssets = await Asset.find({ isMinted: true })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    const formattedAssets = mintedAssets.map(asset => ({
      id: asset.assetId,
      prompt: asset.prompt,
      imageUrl: asset.imageURL,
      owner: asset.ownerAddress,
      metadata: {
        name: asset.metadata.name,
        description: asset.metadata.description,
        createdAt: asset.metadata.createdAt,
        transactionHash: asset.metadata.transactionHash,
        tokenId: asset.metadata.tokenId
      },
      isMinted: asset.isMinted,
      createdAt: asset.createdAt,
      transactionHash: asset.mintTxHash
    }));

    res.json({
      success: true,
      assets: formattedAssets,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalMinted,
        pages: Math.ceil(totalMinted / limitNumber)
      }
    });

  } catch (error) {
    console.error('Get minted assets error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching minted assets'
    });
  }
});

export default router;
