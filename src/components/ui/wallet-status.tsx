import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isMetaMaskInstalled } from '@/lib/wallet';

interface WalletStatusProps {
  isConnected: boolean;
  walletAddress?: string | null;
}

export const WalletStatus = ({ isConnected, walletAddress }: WalletStatusProps) => {
  if (isConnected && walletAddress) {
    return (
      <Alert className="border-green-500/20 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>Wallet Connected</AlertTitle>
        <AlertDescription>
          Connected to {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isMetaMaskInstalled()) {
    return (
      <Alert className="border-orange-500/20 bg-orange-500/10">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <AlertTitle>MetaMask Required</AlertTitle>
        <AlertDescription>
          Please install the MetaMask extension to connect your wallet.
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-400 underline ml-1"
          >
            Download MetaMask
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-blue-500/20 bg-blue-500/10">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertTitle>Wallet Not Connected</AlertTitle>
      <AlertDescription>
        Click "Connect Wallet" to connect your MetaMask wallet and start creating assets.
      </AlertDescription>
    </Alert>
  );
};
