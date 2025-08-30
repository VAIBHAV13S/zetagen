import { ethers, Interface } from 'ethers';

/**
 * Enhanced ZetaForge Universal Service V2
 * Provides comprehensive NFT minting, migration, and management functionality
 */
class EnhancedZetaForgeUniversalService {
    constructor() {
        console.log('🚀 Initializing Enhanced ZetaForge Universal Service V2');
        
        // Environment validation
        const requiredEnvVars = [
            'ZETACHAIN_RPC_URL',
            'ZETACHAIN_PRIVATE_KEY',
            'ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS',
            'ZETAFORGE_LEGACY_CONTRACT_ADDRESS'
        ];
        
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(process.env.ZETACHAIN_RPC_URL);
        
        // Initialize wallet
        const privateKey = process.env.ZETACHAIN_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('ZETACHAIN_PRIVATE_KEY environment variable is required');
        }
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
            throw new Error('ZETACHAIN_PRIVATE_KEY must be a valid 64-character hex string starting with 0x');
        }
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        // Service configuration
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            gasMultiplier: 1.2,
            maxGasLimit: 5000000,
            priceUpdateInterval: 300000, // 5 minutes
            healthCheckInterval: 60000 // 1 minute
        };

        // Performance monitoring
        this.metrics = {
            totalMints: 0,
            successfulMints: 0,
            failedMints: 0,
            totalMigrations: 0,
            avgTransactionTime: 0,
            lastHealthCheck: null
        };

        // Contracts will be initialized in async init()
        this.universalContract = null;
        this.legacyContract = null;
        this.crossChainEnabled = false;

        console.log("Contract Address:", process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS);
        console.log("Provider exists?", !!this.provider);
        console.log("Wallet exists?", !!this.wallet);
    }

    /**
     * Async initialization to load ABI and create contracts
     */
    async init() {
        try {
            console.log('🔧 Loading contract ABIs and initializing contracts...');
            
            // Load Universal Contract ABI using fs approach (most reliable)
            let universalABI;
            try {
                const fs = await import('fs/promises');
                const path = await import('path');
                const { fileURLToPath } = await import('url');
                
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const abiPath = path.join(__dirname, '../abi/ZetaForgeUniversalV2.json');
                
                console.log('📁 Looking for ABI at:', abiPath);
                
                const abiData = await fs.readFile(abiPath, 'utf8');
                const abiJson = JSON.parse(abiData);
                
                // Debug the ABI structure
                console.log('🔍 ABI JSON structure:', {
                    hasAbi: !!abiJson.abi,
                    isArray: Array.isArray(abiJson),
                    keys: Object.keys(abiJson).slice(0, 10), // Limit output
                    type: typeof abiJson,
                    contractName: abiJson.contractName,
                    format: abiJson._format
                });
                
                // Handle Hardhat artifact format
                if (abiJson.abi && Array.isArray(abiJson.abi)) {
                    universalABI = abiJson.abi;
                    console.log('✅ Using .abi property from Hardhat artifact');
                } else if (Array.isArray(abiJson)) {
                    universalABI = abiJson;
                    console.log('✅ Using direct array format');
                } else {
                    throw new Error('ABI not found in expected format');
                }
                
                // Validate it's an array
                if (!Array.isArray(universalABI)) {
                    throw new Error(`ABI is not an array, got: ${typeof universalABI}`);
                }
                
                console.log(`📋 Loaded ABI with ${universalABI.length} items`);
                
            } catch (error) {
                console.error('❌ Failed to load Universal ABI:', error);
                throw new Error(`Cannot load Universal contract ABI: ${error.message}`);
            }
            
            // Validate ABI by creating Interface
            let iface;
            try {
                iface = new Interface(universalABI);
                console.log("✅ Universal ABI Interface created successfully");
                
                // Debug the interface object
                console.log("🔍 Interface debugging:");
                console.log("  - Interface type:", typeof iface);
                console.log("  - Interface is null:", iface === null);
                console.log("  - Interface is undefined:", iface === undefined);
                
                if (iface) {
                    console.log("  - Interface keys:", Object.keys(iface));
                    console.log("  - Has functions:", 'functions' in iface);
                    console.log("  - Functions type:", typeof iface.functions);
                    
                    // Try different ways to access functions
                    if (iface.functions) {
                        console.log("  - Functions keys available");
                    } else if (iface.fragments) {
                        console.log("  - Using fragments instead of functions");
                        const functionFragments = iface.fragments.filter(f => f.type === 'function');
                        console.log(`  - Found ${functionFragments.length} function fragments`);
                        if (functionFragments.length > 0) {
                            console.log("📝 Available functions:", functionFragments.slice(0, 5).map(f => f.name));
                        }
                    }
                }
                
                // Safely get function names
                if (iface && iface.functions && typeof iface.functions === 'object') {
                    const functionKeys = Object.keys(iface.functions);
                    if (functionKeys.length > 0) {
                        console.log("📝 Available functions:", functionKeys.slice(0, 5), "...");
                    } else {
                        console.warn("⚠️ No functions found in ABI interface");
                    }
                } else {
                    console.warn("⚠️ Interface functions property not available");
                    console.log("🔍 Interface properties:", iface ? Object.keys(iface) : 'Interface is null');
                }
                
            } catch (interfaceError) {
                console.error('❌ Failed to create Interface:', interfaceError);
                throw new Error(`Invalid ABI format: ${interfaceError.message}`);
            }
            
            // Create Universal contract instance
            try {
                this.universalContract = new ethers.Contract(
                    process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS,
                    universalABI,
                    this.wallet
                );
                console.log("✅ Universal contract instance created");
            } catch (contractError) {
                console.error('❌ Failed to create contract instance:', contractError);
                throw new Error(`Cannot create contract: ${contractError.message}`);
            }

            // Load Legacy Contract ABI (optional)
            try {
                const fs = await import('fs/promises');
                const path = await import('path');
                const { fileURLToPath } = await import('url');
                
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const legacyAbiPath = path.join(__dirname, '../abi/ZetaForgeLegacy.json');
                
                console.log('📁 Looking for Legacy ABI at:', legacyAbiPath);
                
                const legacyAbiData = await fs.readFile(legacyAbiPath, 'utf8');
                const legacyAbiJson = JSON.parse(legacyAbiData);
                
                let legacyABI;
                // Handle Hardhat artifact format for legacy too
                if (legacyAbiJson.abi && Array.isArray(legacyAbiJson.abi)) {
                    legacyABI = legacyAbiJson.abi;
                    console.log('✅ Using .abi property from Legacy Hardhat artifact');
                } else if (Array.isArray(legacyAbiJson)) {
                    legacyABI = legacyAbiJson;
                    console.log('✅ Using direct array format for Legacy');
                } else {
                    throw new Error('Legacy ABI not found in expected format');
                }
                
                this.legacyContract = new ethers.Contract(
                    process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS,
                    legacyABI,
                    this.wallet
                );
                console.log("✅ Legacy contract initialized");
            } catch (error) {
                console.warn("⚠️ Legacy contract ABI not found, migration features will be disabled:", error.message);
                this.legacyContract = null;
            }

            // Verify contract initialization
            if (this.universalContract && this.universalContract.interface) {
                try {
                    const contractInterface = this.universalContract.interface;
                    if (contractInterface.functions && typeof contractInterface.functions === 'object') {
                        const availableFunctions = Object.keys(contractInterface.functions);
                        console.log(`✅ Contract created with ${availableFunctions.length} functions available`);
                        if (availableFunctions.length > 0) {
                            console.log("🔧 Sample functions:", availableFunctions.slice(0, 3));
                        }
                    } else {
                        console.warn("⚠️ Contract interface functions not accessible");
                        console.log("🔍 Interface properties:", Object.keys(contractInterface));
                    }
                } catch (error) {
                    console.warn("⚠️ Could not access contract interface functions:", error.message);
                }
            } else {
                throw new Error('Contract interface not properly initialized');
            }

            // Enable cross-chain functionality
            this.crossChainEnabled = true;
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            console.log("✅ Enhanced ZetaForge Universal Service V2 initialized successfully");
            
        } catch (err) {
            console.error("❌ Failed to initialize service:", err);
            throw err;
        }
    }

    /**
     * Enhanced contract information with performance metrics
     */
    async getContractInfo() {
        try {
            console.log('📊 Fetching enhanced contract information...');

            // Ensure contracts are initialized
            if (!this.universalContract) {
                throw new Error('Universal contract not initialized');
            }

            // Parallel execution for better performance
            const [
                universalSupply,
                combinedSupply,
                mintPrice,
                universalMode,
                migrationEnabled,
                networkInfo,
                gasPrice,
                blockNumber
            ] = await Promise.all([
                this.universalContract.totalSupply(),
                this.universalContract.totalCombinedSupply(),
                this.universalContract.mintPrice(),
                this.universalContract.universalModeEnabled(),
                this.universalContract.legacyMigrationEnabled(),
                this.provider.getNetwork(),
                this.provider.getFeeData(),
                this.provider.getBlockNumber()
            ]);

            // Get legacy supply if legacy contract is available
            let legacySupply = 0;
            if (this.legacyContract) {
                try {
                    legacySupply = await this.legacyContract.totalSupply();
                } catch (error) {
                    console.warn("Could not fetch legacy supply:", error.message);
                }
            }

            // Get all chain fees in parallel
            const chainIds = [1, 56, 137, 43114, 7001];
            const chainFeePromises = chainIds.map(id => 
                this.universalContract.getChainFee(id).catch(() => ethers.parseEther('0'))
            );
            const chainFeeResults = await Promise.all(chainFeePromises);

            const chainFees = {};
            const chainNames = ['ethereum', 'bsc', 'polygon', 'avalanche', 'zetachain'];
            chainIds.forEach((id, index) => {
                chainFees[chainNames[index]] = {
                    chainId: id,
                    fee: ethers.formatEther(chainFeeResults[index]),
                    feeWei: chainFeeResults[index].toString()
                };
            });

            // Calculate performance metrics
            const successRate = this.metrics.totalMints > 0 
                ? (this.metrics.successfulMints / this.metrics.totalMints * 100).toFixed(2)
                : 0;

            return {
                network: {
                    name: 'ZetaChain Athens Testnet',
                    chainId: Number(networkInfo.chainId),
                    blockNumber: blockNumber,
                    gasPrice: {
                        standard: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
                        fast: ethers.formatUnits(gasPrice.maxFeePerGas || 0, 'gwei')
                    }
                },
                contracts: {
                    universal: {
                        address: process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS,
                        totalSupply: universalSupply.toString(),
                        mintPrice: ethers.formatEther(mintPrice),
                        universalMode: universalMode,
                        migrationEnabled: migrationEnabled,
                        maxSupply: '50000',
                        tokenIdRange: '10001-60000',
                        version: '2.0'
                    },
                    legacy: {
                        address: process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS,
                        totalSupply: legacySupply.toString(),
                        maxSupply: '10000',
                        tokenIdRange: '1-10000',
                        version: '1.0'
                    }
                },
                supply: {
                    combined: combinedSupply.toString(),
                    universal: universalSupply.toString(),
                    legacy: legacySupply.toString(),
                    remaining: (60000 - Number(combinedSupply)).toString(),
                    utilizationRate: ((Number(combinedSupply) / 60000) * 100).toFixed(2) + '%'
                },
                crossChain: {
                    enabled: this.crossChainEnabled,
                    fees: chainFees,
                    supportedChains: chainNames.length,
                    totalNetworks: chainNames
                },
                performance: {
                    totalMints: this.metrics.totalMints,
                    successRate: successRate + '%',
                    avgTransactionTime: this.metrics.avgTransactionTime + 'ms',
                    lastHealthCheck: this.metrics.lastHealthCheck,
                    uptime: this.getUptime()
                },
                features: [
                    'Cross-chain minting',
                    'Legacy contract integration', 
                    'Asset migration',
                    'Enhanced metadata',
                    'Batch operations',
                    'Dynamic fees',
                    'Performance monitoring',
                    'Health checks',
                    'Auto-retry mechanisms',
                    'Gas optimization'
                ]
            };
        } catch (error) {
            console.error('❌ Error getting enhanced contract info:', error);
            throw new Error(`Failed to fetch contract information: ${error.message}`);
        }
    }

    /**
     * Enhanced cross-chain mint with retry mechanism and gas optimization
     */
    async crossChainMintAsset(walletAddress, sourceChain, assetId, prompt, metadataURI, traits) {
        // Check if service is available
        if (!this.universalContract) {
            throw new Error('Universal contract is not initialized. Please check your environment variables (ZETACHAIN_RPC_URL, ZETACHAIN_PRIVATE_KEY, ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS).');
        }

        const startTime = Date.now();
        let attempt = 0;

        while (attempt < this.config.maxRetries) {
            try {
                attempt++;
                console.log(`🌍 Cross-chain mint attempt ${attempt}/${this.config.maxRetries} for asset ${assetId}`);

                // Enhanced pre-checks
                await this.validateMintParameters(walletAddress, assetId, prompt, metadataURI, sourceChain);

                // Check asset status
                const alreadyMinted = await this.universalContract.isAssetMinted(assetId);
                if (alreadyMinted) {
                    throw new Error('Asset already minted');
                }

                // Get optimized gas and fee estimates
                const { fee, gasEstimate, gasPrice } = await this.getOptimizedTransactionParams(
                    walletAddress, sourceChain, assetId, prompt, metadataURI, traits
                );

                console.log(`💰 Optimized fee: ${ethers.formatEther(fee)} ZETA, Gas: ${gasEstimate.toString()}`);

                // Execute with optimized parameters
                const tx = await this.universalContract.crossChainMint(
                    walletAddress,
                    sourceChain,
                    assetId,
                    prompt,
                    metadataURI,
                    traits || '',
                    {
                        value: fee,
                        gasLimit: gasEstimate,
                        gasPrice: gasPrice
                    }
                );

                console.log(`📄 Transaction submitted: ${tx.hash}`);

                // Wait for confirmation with timeout
                const receipt = await this.waitForTransaction(tx.hash, 60000); // 60 second timeout
                console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

                // Get minted token ID
                const tokenId = await this.universalContract.getTokenIdByAssetId(assetId);

                // Update metrics
                this.updateMetrics(true, Date.now() - startTime);

                return {
                    success: true,
                    hash: receipt.transactionHash,
                    transactionHash: receipt.transactionHash,
                    blockNumber: receipt.blockNumber,
                    tokenId: tokenId.toString(),
                    assetId,
                    sourceChain,
                    fee: ethers.formatEther(fee),
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: ethers.formatUnits(receipt.gasPrice || gasPrice, 'gwei'),
                    transactionTime: Date.now() - startTime,
                    contract: 'universal',
                    attempt: attempt,
                    mintFee: ethers.formatEther(fee),
                    retryAttempts: attempt - 1
                };

            } catch (error) {
                console.error(`❌ Mint attempt ${attempt} failed:`, error.message);

                if (attempt >= this.config.maxRetries) {
                    this.updateMetrics(false, Date.now() - startTime);
                    throw new Error(`Cross-chain mint failed after ${this.config.maxRetries} attempts: ${error.message}`);
                }

                // Wait before retry
                await this.delay(this.config.retryDelay * attempt);
            }
        }
    }

    /**
     * Enhanced batch minting with progress tracking
     */
    async batchMintAssets(mintRequests, batchSize = 5) {
        console.log(`🚀 Starting batch mint for ${mintRequests.length} assets with batch size ${batchSize}`);

        const results = {
            successful: [],
            failed: [],
            totalRequests: mintRequests.length,
            startTime: Date.now(),
            metrics: {
                batchSize,
                chunksProcessed: 0,
                avgTimePerChunk: 0
            }
        };

        // Process in chunks to avoid overwhelming the network
        const chunkSize = Math.min(batchSize, 5); // Cap at 5 for safety
        const chunks = this.chunkArray(mintRequests, chunkSize);
        results.metrics.totalChunks = chunks.length;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkStartTime = Date.now();
            console.log(`📦 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} items)`);

            const chunkPromises = chunk.map(async (request) => {
                try {
                    const result = await this.crossChainMintAsset(
                        request.walletAddress,
                        request.sourceChain || 7001,
                        request.assetId,
                        request.prompt,
                        request.metadataURI,
                        request.traits
                    );
                    results.successful.push({ 
                        assetId: request.assetId,
                        hash: result.hash,
                        tokenId: result.tokenId,
                        sourceChain: result.sourceChain,
                        gasUsed: result.gasUsed
                    });
                } catch (error) {
                    results.failed.push({ 
                        assetId: request.assetId,
                        error: error.message 
                    });
                }
            });

            await Promise.all(chunkPromises);
            
            const chunkTime = Date.now() - chunkStartTime;
            results.metrics.chunksProcessed++;
            results.metrics.avgTimePerChunk = Math.round(
                (results.metrics.avgTimePerChunk * (i) + chunkTime) / (i + 1)
            );
            
            // Brief pause between chunks
            if (i < chunks.length - 1) {
                await this.delay(1000);
            }
        }

        results.endTime = Date.now();
        results.totalTime = results.endTime - results.startTime;
        results.successRate = (results.successful.length / results.totalRequests * 100).toFixed(2);

        console.log(`✅ Batch mint completed: ${results.successful.length}/${results.totalRequests} successful`);

        return results;
    }

    /**
     * Enhanced asset migration with validation
     */
    async migrateLegacyAsset(legacyTokenId, walletAddress) {
        try {
            if (!this.legacyContract) {
                throw new Error('Legacy contract not available - migration disabled');
            }

            console.log(`🔄 Enhanced migration for legacy token ${legacyTokenId}`);

            // Enhanced validation
            await this.validateMigrationParameters(legacyTokenId, walletAddress);

            // Get comprehensive legacy metadata
            const [owner, legacyMetadata, legacyURI] = await Promise.all([
                this.legacyContract.ownerOf(legacyTokenId),
                this.legacyContract.getAssetMetadata(legacyTokenId),
                this.legacyContract.tokenURI(legacyTokenId)
            ]);

            if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error('Not owner of legacy token');
            }

            // Check migration eligibility
            const migrationEnabled = await this.universalContract.legacyMigrationEnabled();
            if (!migrationEnabled) {
                throw new Error('Legacy migration is currently disabled');
            }

            // Check if already migrated
            const alreadyMinted = await this.universalContract.isAssetMinted(legacyMetadata.assetId);
            if (alreadyMinted) {
                throw new Error('Asset already migrated to Universal App V2');
            }

            // Optimized gas estimation
            const gasEstimate = await this.universalContract.estimateGas.migrateLegacyAsset(legacyTokenId);
            const gasLimit = gasEstimate * BigInt(Math.floor(this.config.gasMultiplier * 100)) / BigInt(100);

            // Execute migration
            const tx = await this.universalContract.migrateLegacyAsset(legacyTokenId, {
                gasLimit: gasLimit
            });

            console.log(`📄 Migration transaction: ${tx.hash}`);

            // Wait for confirmation
            const receipt = await this.waitForTransaction(tx.hash, 60000);

            // Get new token information
            const newTokenId = await this.universalContract.getTokenIdByAssetId(legacyMetadata.assetId);
            const newMetadata = await this.universalContract.getAssetMetadata(newTokenId);

            // Update migration metrics
            this.metrics.totalMigrations++;

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                legacyTokenId: legacyTokenId.toString(),
                newTokenId: newTokenId.toString(),
                assetId: legacyMetadata.assetId,
                gasUsed: receipt.gasUsed.toString(),
                legacyContract: process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS,
                universalContract: process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS,
                originalMetadata: legacyMetadata,
                enhancedMetadata: newMetadata,
                migrationTime: Date.now()
            };

        } catch (error) {
            console.error('❌ Enhanced migration error:', error);
            throw error;
        }
    }

    /**
     * Enhanced user assets retrieval with pagination
     */
    async getUserAssets(walletAddress, options = {}) {
        const { 
            includeMetadata = true, 
            includeLegacy = true, 
            limit = 50, 
            offset = 0,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = options;

        try {
            console.log(`👤 Getting enhanced user assets for ${walletAddress}`);

            const assets = {
                universal: [],
                legacy: [],
                total: 0,
                pagination: {
                    limit,
                    offset,
                    hasMore: false
                },
                contracts: {
                    universal: process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS,
                    legacy: process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS
                }
            };

            // Get Universal App assets
            try {
                const result = await this.universalContract.getUserAssets(walletAddress);
                
                let universalAssets = result.tokenIds.map((tokenId, index) => ({
                    tokenId: tokenId.toString(),
                    assetId: result.assetIds[index],
                    prompt: result.prompts[index],
                    metadataURI: result.uris[index],
                    timestamp: Number(result.timestamps[index]),
                    sourceChain: Number(result.sourceChains[index]),
                    contract: 'universal',
                    contractAddress: process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS
                }));

                // Add enhanced metadata if requested
                if (includeMetadata) {
                    const metadataPromises = universalAssets.map(async (asset) => {
                        try {
                            const metadata = await this.universalContract.getAssetMetadata(asset.tokenId);
                            return { ...asset, enhancedMetadata: metadata };
                        } catch (error) {
                            console.warn(`Failed to fetch metadata for token ${asset.tokenId}`);
                            return asset;
                        }
                    });
                    universalAssets = await Promise.all(metadataPromises);
                }

                assets.universal = universalAssets;

            } catch (error) {
                console.log('No universal assets found or error fetching:', error.message);
            }

            // Get Legacy assets if requested
            if (includeLegacy && this.legacyContract) {
                try {
                    const legacyBalance = await this.legacyContract.balanceOf(walletAddress);
                    const legacyAssets = [];

                    for (let i = 0; i < Math.min(legacyBalance, 50); i++) {
                        try {
                            const tokenId = await this.legacyContract.tokenOfOwnerByIndex(walletAddress, i);
                            const asset = {
                                tokenId: tokenId.toString(),
                                contract: 'legacy',
                                contractAddress: process.env.ZETAFORGE_LEGACY_CONTRACT_ADDRESS
                            };

                            if (includeMetadata) {
                                const [metadata, uri] = await Promise.all([
                                    this.legacyContract.getAssetMetadata(tokenId),
                                    this.legacyContract.tokenURI(tokenId)
                                ]);
                                asset.metadata = metadata;
                                asset.metadataURI = uri;
                                asset.assetId = metadata.assetId;
                                asset.timestamp = Number(metadata.timestamp);
                            }

                            legacyAssets.push(asset);
                        } catch (error) {
                            console.warn(`Failed to fetch legacy asset at index ${i}`);
                        }
                    }

                    assets.legacy = legacyAssets;

                } catch (error) {
                    console.log('No legacy assets found or error fetching:', error.message);
                }
            }

            // Apply sorting and pagination
            const allAssets = [...assets.universal, ...assets.legacy];
            
            if (sortBy === 'timestamp') {
                allAssets.sort((a, b) => {
                    const aTime = a.timestamp || 0;
                    const bTime = b.timestamp || 0;
                    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
                });
            }

            const paginatedAssets = allAssets.slice(offset, offset + limit);
            assets.pagination.hasMore = allAssets.length > offset + limit;
            assets.total = allAssets.length;

            // Split back into categories for response
            assets.universal = paginatedAssets.filter(a => a.contract === 'universal');
            assets.legacy = paginatedAssets.filter(a => a.contract === 'legacy');

            return assets;

        } catch (error) {
            console.error('❌ Error getting enhanced user assets:', error);
            throw error;
        }
    }

    // Helper methods
    async validateMintParameters(walletAddress, assetId, prompt, metadataURI, sourceChain) {
        console.log(`🔍 Validating mint parameters:`, {
            walletAddress,
            assetId: assetId?.substring(0, 20) + '...',
            promptLength: prompt?.length,
            metadataURI,
            sourceChain,
            metadataURIStartsWithHttp: metadataURI?.startsWith('http')
        });
        
        if (!ethers.isAddress(walletAddress)) {
            throw new Error('Invalid wallet address');
        }
        if (!assetId || assetId.length < 10) {
            throw new Error('Invalid asset ID');
        }
        if (!prompt || prompt.length < 5) {
            throw new Error('Prompt too short');
        }
        if (!metadataURI || !metadataURI.startsWith('http')) {
            throw new Error('Invalid metadata URI');
        }
        if (![1, 56, 137, 43114, 7001].includes(sourceChain)) {
            throw new Error('Unsupported source chain');
        }
        
        console.log(`✅ All mint parameters validated successfully`);
    }

    async validateMigrationParameters(legacyTokenId, walletAddress) {
        if (!ethers.isAddress(walletAddress)) {
            throw new Error('Invalid wallet address');
        }
        if (!legacyTokenId || legacyTokenId < 1) {
            throw new Error('Invalid legacy token ID');
        }
    }

    async getOptimizedTransactionParams(walletAddress, sourceChain, assetId, prompt, metadataURI, traits) {
        // Get current fee for the chain
        const fee = await this.universalContract.getChainFee(sourceChain);
        
        // Estimate gas with buffer
        const gasEstimate = await this.universalContract.estimateGas.crossChainMint(
            walletAddress,
            sourceChain,
            assetId,
            prompt,
            metadataURI,
            traits || '',
            { value: fee }
        );

        // Apply gas multiplier but cap at max limit
        const bufferedGas = gasEstimate * BigInt(Math.floor(this.config.gasMultiplier * 100)) / BigInt(100);
        const finalGasLimit = bufferedGas > BigInt(this.config.maxGasLimit) 
            ? BigInt(this.config.maxGasLimit) 
            : bufferedGas;

        // Get current gas price
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice;

        return { fee, gasEstimate: finalGasLimit, gasPrice };
    }

    async waitForTransaction(hash, timeout = 60000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                const receipt = await this.provider.getTransactionReceipt(hash);
                if (receipt) {
                    return receipt;
                }
            } catch (error) {
                // Continue waiting
            }
            await this.delay(2000); // Check every 2 seconds
        }
        throw new Error('Transaction timeout');
    }

    updateMetrics(success, transactionTime) {
        this.metrics.totalMints++;
        if (success) {
            this.metrics.successfulMints++;
        } else {
            this.metrics.failedMints++;
        }
        
        // Update average transaction time
        const totalTime = this.metrics.avgTransactionTime * (this.metrics.totalMints - 1) + transactionTime;
        this.metrics.avgTransactionTime = Math.round(totalTime / this.metrics.totalMints);
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getUptime() {
        return process.uptime();
    }

    getMetrics() {
        return {
            ...this.metrics,
            serviceUptime: this.getUptime(),
            timestamp: new Date().toISOString()
        };
    }

    startHealthMonitoring() {
        setInterval(async () => {
            try {
                await this.provider.getBlockNumber();
                this.metrics.lastHealthCheck = new Date().toISOString();
            } catch (error) {
                console.error('❌ Health check failed:', error.message);
            }
        }, this.config.healthCheckInterval);
    }

    // Additional utility methods
    async getChainFees() {
        try {
            const chains = {
                1: 'ethereum',
                56: 'bsc', 
                137: 'polygon',
                43114: 'avalanche',
                7001: 'zetachain'
            };

            const fees = {};
            const feePromises = Object.entries(chains).map(async ([chainId, name]) => {
                try {
                    const fee = await this.universalContract.getChainFee(parseInt(chainId));
                    return [name, {
                        chainId: parseInt(chainId),
                        fee: ethers.formatEther(fee),
                        feeWei: fee.toString(),
                        usd: await this.convertZetaToUSD(ethers.formatEther(fee)) // If price oracle available
                    }];
                } catch (error) {
                    return [name, { error: error.message }];
                }
            });

            const results = await Promise.all(feePromises);
            results.forEach(([name, data]) => {
                fees[name] = data;
            });

            return fees;
        } catch (error) {
            console.error('❌ Error getting enhanced chain fees:', error);
            throw error;
        }
    }

    async convertZetaToUSD(zetaAmount) {
        // Placeholder for price conversion - integrate with price oracle
        return (parseFloat(zetaAmount) * 0.50).toFixed(4); // Assuming $0.50 per ZETA
    }

    async isAssetMinted(assetId) {
        try {
            const universalMinted = await this.universalContract.isAssetMinted(assetId);
            return universalMinted;
        } catch (error) {
            console.error('❌ Error checking asset status:', error);
            return false;
        }
    }

    async getAssetMetadata(assetId) {
        try {
            const tokenId = await this.universalContract.getTokenIdByAssetId(assetId);
            if (tokenId.toString() !== '0') {
                const metadata = await this.universalContract.getAssetMetadata(tokenId);
                return {
                    ...metadata,
                    contract: 'universal',
                    tokenId: tokenId.toString(),
                    contractAddress: process.env.ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS
                };
            }
            
            throw new Error('Asset not found');
        } catch (error) {
            console.error('❌ Error getting enhanced asset metadata:', error);
            throw error;
        }
    }
}

// Create a singleton instance and initialize ABI
const zetaForgeService = new EnhancedZetaForgeUniversalService();
await zetaForgeService.init();

// Export both the class and individual functions for backward compatibility
export default EnhancedZetaForgeUniversalService;

// Export individual functions that routes expect
export const crossChainMintAsset = (walletAddress, sourceChain, assetId, prompt, metadataURI, traits) => 
    zetaForgeService.crossChainMintAsset(walletAddress, sourceChain, assetId, prompt, metadataURI, traits);

export const batchMintAssets = (mintRequests, batchSize) => 
    zetaForgeService.batchMintAssets(mintRequests, batchSize);

export const isAssetMinted = (assetId) => 
    zetaForgeService.isAssetMinted(assetId);

export const getAssetMetadata = (assetId) => 
    zetaForgeService.getAssetMetadata(assetId);

export const getUserAssets = (walletAddress) => 
    zetaForgeService.getUserAssets(walletAddress);

export const getContractInfo = () => 
    zetaForgeService.getContractInfo();

export const migrateLegacyAsset = (legacyTokenId, walletAddress) => 
    zetaForgeService.migrateLegacyAsset(legacyTokenId, walletAddress);