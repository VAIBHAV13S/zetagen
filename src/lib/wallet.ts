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

export async function switchToZetaChain() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Try to switch to ZetaChain testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ZETACHAIN_TESTNET.chainId }],
    });
  } catch (switchError: any) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ZETACHAIN_TESTNET],
        });
      } catch (addError) {
        throw new Error('Failed to add ZetaChain network');
      }
    } else {
      throw new Error('Failed to switch to ZetaChain network');
    }
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Switch to ZetaChain first
    await switchToZetaChain();
    
    // Then request accounts
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }
    
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
}

export function watchAccountChanges(callback: (accounts: string[]) => void) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
}

export function watchChainChanges(callback: (chainId: string) => void) {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
}
