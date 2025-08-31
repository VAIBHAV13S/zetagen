import { create } from 'zustand';
import { callEdgeFunction, API_ENDPOINTS } from '@/lib/api';
import { checkWalletConnection, watchAccountChanges, watchChainChanges, connectWallet } from '@/lib/wallet';
import { 
  deployAssetMultiChain, 
  UniversalAsset, 
  stZetaGateway, 
  universalBridge,
  SUPPORTED_CHAINS,
  getTransferQuote
} from '@/lib/gateway';

export interface Asset {
  id: string;
  prompt: string;
  imageUrl: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    transactionHash?: string;
  };
  isMinted: boolean;
}

interface AppState {
  // Wallet connection
  isWalletConnected: boolean;
  walletAddress: string | null;
  isConnectingWallet: boolean; // Add connection state
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  initializeWallet: () => Promise<void>;
  connectWalletAsync: () => Promise<void>; // Add centralized connection function

  // Assets
  assets: Asset[];
  currentAsset: Asset | null;
  isGenerating: boolean;
  isMinting: boolean;

  // Cross-chain configuration
  selectedSourceChain: number;
  setSelectedSourceChain: (chainId: number) => void;

  // Gateway API Features
  universalAssets: UniversalAsset[];
  isDeployingMultiChain: boolean;
  isProcessingPayment: boolean;
  isBridgingAsset: boolean;
  selectedTargetChains: number[];
  setSelectedTargetChains: (chains: number[]) => void;
  deployAssetMultiChain: (asset: Asset) => Promise<UniversalAsset>;
  processStZetaPayment: (amount: string, service: 'generation' | 'minting' | 'premium') => Promise<any>;
  bridgeAssetToChain: (universalAssetId: string, fromChain: number, toChain: number) => Promise<any>;
  getCrossChainQuote: (token: string, amount: string, fromChain: number, toChain: number) => Promise<any>;

  // Actions
  setCurrentAsset: (asset: Asset | null) => void;
  addAsset: (asset: Asset) => void;
  generateAsset: (prompt: string) => Promise<{ success: boolean; asset: Asset }>;
  mintAsset: (assetId: string, sourceChain?: number) => Promise<void>;
  fetchAssets: (owner?: string) => Promise<void>;
  
  // UI state
  currentPage: 'landing' | 'generator' | 'gallery';
  setCurrentPage: (page: 'landing' | 'generator' | 'gallery') => void;
  
  // Gallery filters
  galleryFilter: 'all' | 'my-assets' | 'trending';
  setGalleryFilter: (filter: 'all' | 'my-assets' | 'trending') => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  isWalletConnected: false,
  walletAddress: null,
  isConnectingWallet: false,
  assets: [],
  currentAsset: null,
  isGenerating: false,
  isMinting: false,
  currentPage: 'landing',
  galleryFilter: 'all',
  selectedSourceChain: 7001, // Default to ZetaChain Testnet
  
  // Gateway API initial state
  universalAssets: [],
  isDeployingMultiChain: false,
  isProcessingPayment: false,
  isBridgingAsset: false,
  selectedTargetChains: [1, 56, 137, 7001], // Default to all supported chains

  // Wallet actions
  connectWallet: (address) => {
    set({ isWalletConnected: true, walletAddress: address });
    // Store in localStorage for persistence
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('isWalletConnected', 'true');
  },
  
  disconnectWallet: () => {
    set({ isWalletConnected: false, walletAddress: null });
    // Clear from localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isWalletConnected');
  },

  initializeWallet: async () => {
    // Prevent multiple initializations
    if (get().isWalletConnected !== undefined) {
      console.log('🔄 Wallet already initialized');
      return;
    }

    try {
      // Check if wallet was previously connected
      const storedAddress = localStorage.getItem('walletAddress');
      const wasConnected = localStorage.getItem('isWalletConnected') === 'true';
      
      if (wasConnected && storedAddress) {
        // Check if wallet is still connected
        const currentAddress = await checkWalletConnection();
        if (currentAddress && currentAddress.toLowerCase() === storedAddress.toLowerCase()) {
          set({ isWalletConnected: true, walletAddress: currentAddress });
          console.log('Wallet reconnected on app load:', currentAddress);
        } else {
          // Clear stored data if wallet is no longer connected
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('isWalletConnected');
        }
      }

      // Set up wallet event listeners
      watchAccountChanges((accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          get().disconnectWallet();
        } else {
          // User switched accounts
          const newAddress = accounts[0];
          if (newAddress !== get().walletAddress) {
            // Update the wallet address without triggering a new connection
            set({ walletAddress: newAddress });
            localStorage.setItem('walletAddress', newAddress);
          }
        }
      });

      watchChainChanges((chainId) => {
        console.log('Chain changed to:', chainId);
        // You can add logic here to handle chain changes
      });

    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  },

  // Centralized wallet connection function
  connectWalletAsync: async () => {
    const { isConnectingWallet, isWalletConnected, walletAddress } = get();
    
    // If already connected, don't attempt to connect again
    if (isWalletConnected && walletAddress) {
      console.log('✅ Wallet already connected');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnectingWallet) {
      console.log('🔄 Wallet connection already in progress...');
      return;
    }

    set({ isConnectingWallet: true });
    
    try {
      console.log('🔌 Connecting wallet from store...');
      
      const address = await connectWallet();
      set({ 
        isWalletConnected: true, 
        walletAddress: address,
        isConnectingWallet: false 
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('isWalletConnected', 'true');
      
      console.log('✅ Wallet connected successfully:', address);
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      
      // Handle specific MetaMask errors
      if (error.code === -32002) {
        console.log('⚠️ MetaMask is already processing a request. Please wait and try again.');
        // For this specific error, don't reset the connecting state immediately
        // Give user time to try again
        setTimeout(() => {
          set({ isConnectingWallet: false });
        }, 2000);
      } else if (error.message?.includes('MetaMask is busy')) {
        console.log('⚠️ MetaMask is busy, user should wait and retry');
        setTimeout(() => {
          set({ isConnectingWallet: false });
        }, 3000);
      } else {
        set({ isConnectingWallet: false });
      }
      
      throw error;
    }
  },

  // Asset actions
  setCurrentAsset: (asset) => set({ currentAsset: asset }),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),
  setSelectedSourceChain: (chainId) => set({ selectedSourceChain: chainId }),

  generateAsset: async (prompt) => {
    set({ isGenerating: true });
    
    try {
      const walletAddress = get().walletAddress;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      console.log('🚀 Starting asset generation with prompt:', prompt.substring(0, 50) + '...');
      console.log('👛 Using wallet address:', walletAddress);

      const response = await callEdgeFunction(API_ENDPOINTS.generateAsset, {
        prompt,
        walletAddress,
        style: 'digital-art',
        quality: 'high',
        assetType: 'artwork'
      });

      console.log('� API Response:', response);

      if (!response.success) {
        console.error('❌ API Error Response:', response);
        throw new Error(response.error || 'Failed to generate asset');
      }

      console.log('✅ Asset generation successful');
      console.log('🔍 Asset data received:', response.asset);
      console.log('🖼️ Image URL (imageUrl):', response.asset.imageUrl);
      console.log('🖼️ Image URL (imageURL):', response.asset.imageURL);
      
      // Use imageUrl from response, fallback to imageURL if needed
      const finalAsset = {
        ...response.asset,
        id: response.asset.assetId || response.asset.id, // Map assetId to id
        imageUrl: response.asset.imageUrl || response.asset.imageURL
      };
      console.log('🎯 Final asset object:', finalAsset);

      if (response.success && finalAsset) {
        set((state) => ({
          assets: [finalAsset, ...state.assets],
          currentAsset: finalAsset,
          isGenerating: false,
        }));
        
        console.log('💾 Asset saved to store successfully');
        return { success: true, asset: finalAsset };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      set({ isGenerating: false });
      throw error;
    }
  },

  mintAsset: async (assetId, sourceChain) => {
    set({ isMinting: true });
    
    try {
      const walletAddress = get().walletAddress;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Use provided sourceChain or default to selectedSourceChain
      const chainToUse = sourceChain || get().selectedSourceChain;

      const response = await callEdgeFunction(API_ENDPOINTS.mintAsset, {
        assetId,
        walletAddress,
        sourceChain: chainToUse
      });

      if (response.success) {
        set((state) => ({
          isMinting: false,
          currentAsset: state.currentAsset?.id === assetId 
            ? {
                ...state.currentAsset,
                isMinted: true,
                metadata: {
                  ...state.currentAsset.metadata,
                  transactionHash: response.txHash
                }
              }
            : state.currentAsset,
          assets: state.assets.map(asset => 
            asset.id === assetId 
              ? { 
                  ...asset, 
                  isMinted: true,
                  metadata: {
                    ...asset.metadata,
                    transactionHash: response.txHash
                  }
                }
              : asset
          )
        }));
      } else {
        throw new Error(response.error || 'Failed to mint asset');
      }
    } catch (error) {
      console.error('Minting failed:', error);
      set({ isMinting: false });
      throw error;
    }
  },

  fetchAssets: async (owner) => {
    try {
      let url = API_ENDPOINTS.getAssets;
      if (owner) {
        url = `${API_ENDPOINTS.getAssets}?owner=${encodeURIComponent(owner)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        const formattedAssets: Asset[] = data.assets.map((asset: any) => ({
          id: asset.assetId || asset.id,
          prompt: asset.prompt,
          imageUrl: asset.imageUrl,
          owner: asset.owner,
          metadata: {
            name: asset.metadata.name,
            description: asset.metadata.description,
            createdAt: asset.metadata.createdAt,
            transactionHash: asset.metadata.transactionHash,
          },
          isMinted: asset.isMinted,
        }));

        set({ assets: formattedAssets });
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  },

  // UI actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setGalleryFilter: (filter) => set({ galleryFilter: filter }),

  // Gateway API actions
  setSelectedTargetChains: (chains) => set({ selectedTargetChains: chains }),

  deployAssetMultiChain: async (asset) => {
    const walletAddress = get().walletAddress;
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    set({ isDeployingMultiChain: true });

    try {
      console.log('🚀 Deploying asset to multiple chains:', asset.prompt);
      
      const universalAsset = await deployAssetMultiChain(
        {
          id: asset.id,
          prompt: asset.prompt,
          imageUrl: asset.imageUrl,
          metadata: asset.metadata
        },
        walletAddress,
        get().selectedTargetChains
      );

      set((state) => ({
        universalAssets: [universalAsset, ...state.universalAssets],
        isDeployingMultiChain: false
      }));

      console.log('✅ Multi-chain deployment completed:', universalAsset);
      return universalAsset;
    } catch (error) {
      console.error('❌ Multi-chain deployment failed:', error);
      set({ isDeployingMultiChain: false });
      throw error;
    }
  },

  processStZetaPayment: async (amount, service) => {
    const walletAddress = get().walletAddress;
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    set({ isProcessingPayment: true });

    try {
      console.log(`💰 Processing stZETA payment: ${amount} for ${service}`);
      
      const payment = await stZetaGateway.processPayment(
        amount,
        service,
        walletAddress,
        get().selectedTargetChains
      );

      set({ isProcessingPayment: false });
      console.log('✅ Payment processed:', payment);
      return payment;
    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      set({ isProcessingPayment: false });
      throw error;
    }
  },

  bridgeAssetToChain: async (universalAssetId, fromChain, toChain) => {
    const walletAddress = get().walletAddress;
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    set({ isBridgingAsset: true });

    try {
      console.log(`🌉 Bridging asset ${universalAssetId} from ${fromChain} to ${toChain}`);
      
      const bridgeResult = await universalBridge.bridgeAssetToChain(
        universalAssetId,
        fromChain,
        toChain,
        walletAddress
      );

      set({ isBridgingAsset: false });
      console.log('✅ Asset bridged successfully:', bridgeResult);
      return bridgeResult;
    } catch (error) {
      console.error('❌ Asset bridge failed:', error);
      set({ isBridgingAsset: false });
      throw error;
    }
  },

  getCrossChainQuote: async (token, amount, fromChain, toChain) => {
    try {
      console.log(`💱 Getting quote for ${amount} ${token} from ${fromChain} to ${toChain}`);
      
      const quote = await getTransferQuote(token, amount, fromChain, toChain);
      console.log('✅ Quote received:', quote);
      return quote;
    } catch (error) {
      console.error('❌ Quote fetch failed:', error);
      throw error;
    }
  }
}));