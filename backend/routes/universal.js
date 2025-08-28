import express from 'express';
import { ethers } from 'ethers';
import EnhancedZetaForgeUniversalService from '../services/zetaForgeUniversalService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const universalService = new EnhancedZetaForgeUniversalService();

/**
 * @route GET /api/universal/info
 * @desc Get Universal App contract information with performance metrics
 */
router.get('/info', asyncHandler(async (req, res) => {
    const info = await universalService.getContractInfo();
    
    res.json({
        success: true,
        data: {
            ...info,
            serviceMetrics: universalService.getMetrics(),
            serviceUptime: universalService.getUptime(),
            lastHealthCheck: universalService.metrics.lastHealthCheck
        }
    });
}));

/**
 * @route POST /api/universal/mint
 * @desc Cross-chain mint NFT with enhanced error handling and validation
 */
router.post('/mint', asyncHandler(async (req, res) => {
    const { walletAddress, assetId, prompt, metadataURI, traits, sourceChain = 7001 } = req.body;

    // Enhanced validation using service method
    await universalService.validateMintParameters(walletAddress, assetId, prompt, metadataURI, sourceChain);

    // Check if asset already minted with caching
    const alreadyMinted = await universalService.isAssetMinted(assetId);
    if (alreadyMinted) {
        return res.status(400).json({
            success: false,
            error: 'Asset already minted',
            assetId,
            contract: 'universal'
        });
    }

    // Get optimized transaction parameters
    const txParams = await universalService.getOptimizedTransactionParams(
        walletAddress, sourceChain, assetId, prompt, metadataURI, traits
    );

    // Execute mint with retry mechanism and performance tracking
    const startTime = Date.now();
    const result = await universalService.crossChainMintAsset(
        walletAddress,
        sourceChain,
        assetId,
        prompt,
        metadataURI,
        traits || ''
    );
    const executionTime = Date.now() - startTime;

    res.json({
        success: true,
        data: {
            ...result,
            executionTime: `${executionTime}ms`,
            optimizedGas: ethers.formatUnits(txParams.gasEstimate, 'wei'),
            chainFee: ethers.formatEther(txParams.fee),
            serviceMetrics: universalService.getMetrics()
        }
    });
}));

/**
 * @route POST /api/universal/migrate
 * @desc Migrate legacy asset to Universal App with enhanced validation
 */
router.post('/migrate', asyncHandler(async (req, res) => {
    const { legacyTokenId, walletAddress } = req.body;

    // Enhanced validation using service method
    await universalService.validateMigrationParameters(legacyTokenId, walletAddress);

    const startTime = Date.now();
    const result = await universalService.migrateLegacyAsset(
        parseInt(legacyTokenId),
        walletAddress
    );
    const executionTime = Date.now() - startTime;

    res.json({
        success: true,
        data: {
            ...result,
            executionTime: `${executionTime}ms`,
            migrationComplete: true,
            serviceMetrics: universalService.getMetrics()
        }
    });
}));

/**
 * @route GET /api/universal/assets/:walletAddress
 * @desc Get user assets from Universal App with enhanced data
 */
router.get('/assets/:walletAddress', asyncHandler(async (req, res) => {
    const { walletAddress } = req.params;
    const { includeMetadata = 'true', limit = 50, offset = 0 } = req.query;

    if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format'
        });
    }

    const assets = await universalService.getUserAssets(walletAddress);
    
    // Enhance with metadata if requested
    let enhancedAssets = assets;
    if (includeMetadata === 'true' && assets.length > 0) {
        enhancedAssets = await Promise.all(
            assets.slice(parseInt(offset), parseInt(offset) + parseInt(limit)).map(async (asset) => {
                try {
                    const metadata = await universalService.getAssetMetadata(asset.assetId);
                    return { ...asset, metadata };
                } catch (error) {
                    return { ...asset, metadataError: error.message };
                }
            })
        );
    }

    res.json({
        success: true,
        data: {
            assets: enhancedAssets,
            totalCount: assets.length,
            walletAddress,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: assets.length > parseInt(offset) + parseInt(limit)
            },
            serviceMetrics: universalService.getMetrics()
        }
    });
}));

/**
 * @route GET /api/universal/asset/:assetId
 * @desc Get asset metadata
 */
router.get('/asset/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                error: 'Asset ID required'
            });
        }

        const metadata = await universalService.getAssetMetadata(assetId);

        res.json({
            success: true,
            data: metadata
        });

    } catch (error) {
        console.error('Get asset error:', error);
        res.status(404).json({
            success: false,
            error: 'Asset not found'
        });
    }
});

/**
 * @route GET /api/universal/status/:assetId
 * @desc Check if asset is minted
 */
router.get('/status/:assetId', async (req, res) => {
    try {
        const { assetId } = req.params;

        if (!assetId) {
            return res.status(400).json({
                success: false,
                error: 'Asset ID required'
            });
        }

        const isMinted = await universalService.isAssetMinted(assetId);

        res.json({
            success: true,
            data: {
                assetId,
                isMinted,
                contract: isMinted ? 'universal' : null
            }
        });

    } catch (error) {
        console.error('Asset status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/universal/fees
 * @desc Get cross-chain fees with USD conversion and optimization suggestions
 */
router.get('/fees', asyncHandler(async (req, res) => {
    const fees = await universalService.getChainFees();
    
    // Add optimization suggestions
    const optimizationTips = {
        cheapestChain: Object.entries(fees).reduce((min, [chain, data]) => 
            parseFloat(data.fee || '0') < parseFloat(min.fee || Infinity) ? { chain, ...data } : min, {}),
        averageFee: Object.values(fees).reduce((sum, data) => 
            sum + parseFloat(data.fee || '0'), 0) / Object.keys(fees).length,
        recommendations: {
            ethereum: "High security, but expensive gas fees",
            bsc: "Fast and cheap transactions",
            polygon: "Great balance of speed and cost",
            avalanche: "Fast finality and low fees",
            zetachain: "Native chain with lowest fees"
        }
    };

    res.json({
        success: true,
        data: {
            fees,
            optimization: optimizationTips,
            timestamp: new Date().toISOString(),
            serviceMetrics: universalService.getMetrics()
        }
    });
}));

/**
 * @route POST /api/universal/batch-mint
 * @desc Batch mint multiple assets with enhanced processing
 */
router.post('/batch-mint', asyncHandler(async (req, res) => {
    const { mintRequests, batchSize = 5 } = req.body;

    if (!Array.isArray(mintRequests) || mintRequests.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'mintRequests array is required and cannot be empty'
        });
    }

    if (mintRequests.length > 20) {
        return res.status(400).json({
            success: false,
            error: 'Maximum 20 mint requests allowed per batch'
        });
    }

    // Validate all requests first
    for (const request of mintRequests) {
        await universalService.validateMintParameters(
            request.walletAddress,
            request.assetId,
            request.prompt,
            request.metadataURI,
            request.sourceChain || 7001
        );
    }

    const startTime = Date.now();
    const results = await universalService.batchMintAssets(mintRequests, parseInt(batchSize));
    const executionTime = Date.now() - startTime;

    res.json({
        success: true,
        data: {
            ...results,
            executionTime: `${executionTime}ms`,
            batchSize: parseInt(batchSize),
            totalProcessed: mintRequests.length,
            serviceMetrics: universalService.getMetrics()
        }
    });
}));

/**
 * @route GET /api/universal/metrics
 * @desc Get service performance metrics and health status
 */
router.get('/metrics', asyncHandler(async (req, res) => {
    const metrics = universalService.getMetrics();
    const uptime = universalService.getUptime();
    
    // Calculate success rate
    const successRate = metrics.totalMints > 0 
        ? ((metrics.successfulMints / metrics.totalMints) * 100).toFixed(2)
        : 100;

    res.json({
        success: true,
        data: {
            ...metrics,
            serviceUptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            successRate: `${successRate}%`,
            averageTransactionTime: `${metrics.avgTransactionTime}ms`,
            healthStatus: metrics.lastHealthCheck ? 'healthy' : 'unknown',
            timestamp: new Date().toISOString()
        }
    });
}));

/**
 * @route POST /api/universal/estimate-gas
 * @desc Estimate gas costs for cross-chain minting
 */
router.post('/estimate-gas', asyncHandler(async (req, res) => {
    const { walletAddress, assetId, prompt, metadataURI, traits, sourceChain = 7001 } = req.body;

    // Validate parameters
    await universalService.validateMintParameters(walletAddress, assetId, prompt, metadataURI, sourceChain);

    // Get optimized transaction parameters
    const txParams = await universalService.getOptimizedTransactionParams(
        walletAddress, sourceChain, assetId, prompt, metadataURI, traits
    );

    // Calculate costs in different units
    const gasInEth = ethers.formatEther(txParams.gasEstimate * txParams.gasPrice);
    const feeInEth = ethers.formatEther(txParams.fee);
    const totalCostEth = parseFloat(gasInEth) + parseFloat(feeInEth);

    res.json({
        success: true,
        data: {
            gasEstimate: ethers.formatUnits(txParams.gasEstimate, 'wei'),
            gasPrice: ethers.formatUnits(txParams.gasPrice, 'gwei') + ' gwei',
            gasCostETH: gasInEth,
            chainFeeETH: feeInEth,
            totalCostETH: totalCostEth.toString(),
            sourceChain,
            optimization: {
                gasMultiplier: "1.1x safety buffer applied",
                recommendation: totalCostEth < 0.001 ? "Low cost - good time to mint" : "Consider minting on a cheaper chain"
            },
            timestamp: new Date().toISOString()
        }
    });
}));

export default router;
