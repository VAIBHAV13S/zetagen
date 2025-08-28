import { create } from 'zustand';
import { callEdgeFunction, API_ENDPOINTS } from '@/lib/api';

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
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;

  // Assets
  assets: Asset[];
  currentAsset: Asset | null;
  isGenerating: boolean;
  isMinting: boolean;

  // Actions
  setCurrentAsset: (asset: Asset | null) => void;
  addAsset: (asset: Asset) => void;
  generateAsset: (prompt: string) => Promise<void>;
  mintAsset: (assetId: string) => Promise<void>;
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
  assets: [],
  currentAsset: null,
  isGenerating: false,
  isMinting: false,
  currentPage: 'landing',
  galleryFilter: 'all',

  // Wallet actions
  connectWallet: (address) => set({ isWalletConnected: true, walletAddress: address }),
  disconnectWallet: () => set({ isWalletConnected: false, walletAddress: null }),

  // Asset actions
  setCurrentAsset: (asset) => set({ currentAsset: asset }),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),

  generateAsset: async (prompt) => {
    set({ isGenerating: true });
    
    try {
      const walletAddress = get().walletAddress;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const response = await callEdgeFunction(API_ENDPOINTS.generateAsset, {
        prompt,
        walletAddress
      });

      if (response.success) {
        const newAsset: Asset = {
          id: response.asset.assetId,
          prompt: response.asset.prompt,
          imageUrl: response.asset.imageUrl,
          owner: response.asset.owner,
          metadata: response.asset.metadata,
          isMinted: response.asset.isMinted,
        };

        set({ 
          isGenerating: false, 
          currentAsset: newAsset 
        });
        
        get().addAsset(newAsset);
      } else {
        throw new Error(response.error || 'Failed to generate asset');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      set({ isGenerating: false });
      throw error;
    }
  },

  mintAsset: async (assetId) => {
    set({ isMinting: true });
    
    try {
      const walletAddress = get().walletAddress;
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const response = await callEdgeFunction(API_ENDPOINTS.mintAsset, {
        assetId,
        walletAddress
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
}));