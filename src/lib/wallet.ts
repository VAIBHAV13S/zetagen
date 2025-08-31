// ZetaChain network configuration
export const ZETACHAIN_TESTNET = {
  chainId: '0x1B59', // 7001 in hex
  chainName: 'ZetaChain Athens Testnet',
  nativeCurrency: {
    name: 'ZETA',
    symbol: 'ZETA',
    decimals: 18,
  },
  rpcUrls: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
  blockExplorerUrls: ['https://zetachain-athens-3.blockscout.com/'],
};

// Check if MetaMask is installed and available
export function isMetaMaskInstalled(): boolean {
  const hasEthereum = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  const isMetaMask = hasEthereum && window.ethereum.isMetaMask === true;
  
  console.log('🔍 MetaMask check:', {
    hasEthereum,
    isMetaMask,
    ethereum: window.ethereum ? 'available' : 'not available'
  });
  
  return isMetaMask;
}

// Check if wallet is already connected
export async function checkWalletConnection(): Promise<string | null> {
  console.log('🔍 Checking wallet connection...');
  
  if (!isMetaMaskInstalled()) {
    console.log('❌ MetaMask not installed');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts' 
    });
    
    console.log('📋 Current accounts:', accounts);
    
    if (accounts.length > 0) {
      console.log('✅ Wallet already connected:', accounts[0]);
      return accounts[0];
    }
    
    console.log('ℹ️ No accounts found');
    return null;
  } catch (error) {
    console.error('❌ Error checking wallet connection:', error);
    return null;
  }
}

// Get current chain ID
export async function getCurrentChainId(): Promise<string | null> {
  console.log('🔍 Getting current chain ID...');
  
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });
    
    console.log('⛓️ Current chain ID:', chainId);
    return chainId;
  } catch (error) {
    console.error('❌ Error getting chain ID:', error);
    return null;
  }
}

export async function switchToZetaChain() {
  console.log('🔄 Switching to ZetaChain...');
  
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask not found. Please install MetaMask extension.');
  }

  try {
    // Check current chain first
    const currentChainId = await getCurrentChainId();
    
    if (currentChainId === ZETACHAIN_TESTNET.chainId) {
      console.log('✅ Already on ZetaChain testnet');
      return;
    }

    console.log(`🔄 Switching from chain ${currentChainId} to ${ZETACHAIN_TESTNET.chainId}`);

    // Try to switch to ZetaChain testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ZETACHAIN_TESTNET.chainId }],
    });
    
    console.log('✅ Successfully switched to ZetaChain testnet');
  } catch (switchError: any) {
    console.error('❌ Switch error:', switchError);
    
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      console.log('➕ Adding ZetaChain network...');
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ZETACHAIN_TESTNET],
        });
        console.log('✅ Successfully added ZetaChain network');
      } catch (addError) {
        console.error('❌ Failed to add ZetaChain network:', addError);
        throw new Error('Failed to add ZetaChain network. Please add it manually in MetaMask.');
      }
    } else {
      console.error('❌ Failed to switch to ZetaChain network:', switchError);
      throw new Error('Failed to switch to ZetaChain network. Please switch manually in MetaMask.');
    }
  }
}

// Global flag to prevent multiple simultaneous connection attempts
let isConnecting = false;
let connectionPromise: Promise<string> | null = null;

export async function connectWallet() {
  console.log('🔌 Connecting wallet...');
  
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask not found. Please install MetaMask extension.');
  }

  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    console.log('🔄 Connection already in progress, returning existing promise...');
    return connectionPromise;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log('🔄 Connection already in progress, waiting...');
    // Wait longer for MetaMask to finish processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    if (isConnecting) {
      throw new Error('Wallet connection already in progress. Please wait.');
    }
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Add a longer delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if already connected
      const existingAccount = await checkWalletConnection();
      if (existingAccount) {
        console.log('✅ Wallet already connected:', existingAccount);
        return existingAccount;
      }

      // Switch to ZetaChain first
      await switchToZetaChain();
      
      console.log('👛 Requesting accounts...');
      
      // Add another delay before requesting accounts
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then request accounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('📋 Received accounts:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }
      
      console.log('✅ Wallet connected successfully:', accounts[0]);
      return accounts[0];
    } catch (error: any) {
      // Special handling for MetaMask "already processing" error
      if (error.code === -32002) {
        console.log('⚠️ MetaMask is already processing, waiting and retrying...');
        // Wait for MetaMask to finish processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          // Try one more time
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          if (accounts.length === 0) {
            throw new Error('No accounts found. Please unlock MetaMask and try again.');
          }
          
          console.log('✅ Wallet connected successfully after retry:', accounts[0]);
          return accounts[0];
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
          throw new Error('MetaMask is busy. Please wait a moment and try again.');
        }
      }
      
      throw error;
    } finally {
      isConnecting = false;
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export function watchAccountChanges(callback: (accounts: string[]) => void) {
  if (isMetaMaskInstalled()) {
    console.log('👂 Setting up account change listener');
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('🔄 Accounts changed:', accounts);
      callback(accounts);
    });
  }
}

export function watchChainChanges(callback: (chainId: string) => void) {
  if (isMetaMaskInstalled()) {
    console.log('👂 Setting up chain change listener');
    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log('🔄 Chain changed to:', chainId);
      callback(chainId);
    });
  }
}

// Disconnect wallet (clear stored state)
export function disconnectWallet() {
  // This function clears the local state
  // MetaMask connection remains active until user disconnects manually
  console.log('🔌 Wallet disconnected locally');
}
