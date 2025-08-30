import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isMetaMaskInstalled, checkWalletConnection, getCurrentChainId } from '@/lib/wallet';
import { Bug, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const WalletDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ethereum: {
          available: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
          isMetaMask: isMetaMaskInstalled(),
        },
        wallet: {
          connected: null as string | null,
          chainId: null as string | null,
        }
      };

      if (info.ethereum.available) {
        try {
          info.wallet.connected = await checkWalletConnection();
          info.wallet.chainId = await getCurrentChainId();
        } catch (error) {
          console.error('Error getting wallet info:', error);
        }
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (value: any) => {
    if (value === null || value === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (value === true || value) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (value: any) => {
    if (value === null || value === undefined) return 'bg-yellow-500/20 text-yellow-700';
    if (value === true || value) return 'bg-green-500/20 text-green-700';
    return 'bg-red-500/20 text-red-700';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Wallet Debug Information
        </CardTitle>
        <CardDescription>
          Run diagnostics to troubleshoot wallet connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebug} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Environment</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.ethereum.available)}
                    <span className="text-sm">Ethereum Available</span>
                    <Badge variant="outline" className={getStatusColor(debugInfo.ethereum.available)}>
                      {debugInfo.ethereum.available ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.ethereum.isMetaMask)}
                    <span className="text-sm">MetaMask Detected</span>
                    <Badge variant="outline" className={getStatusColor(debugInfo.ethereum.isMetaMask)}>
                      {debugInfo.ethereum.isMetaMask ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Wallet Status</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.wallet.connected)}
                    <span className="text-sm">Connected</span>
                    <Badge variant="outline" className={getStatusColor(debugInfo.wallet.connected)}>
                      {debugInfo.wallet.connected ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.wallet.chainId)}
                    <span className="text-sm">Chain ID</span>
                    <Badge variant="outline">
                      {debugInfo.wallet.chainId || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Connection Details</h4>
              {debugInfo.wallet.connected && (
                <div className="text-sm text-muted-foreground">
                  Address: {debugInfo.wallet.connected}
                </div>
              )}
              {debugInfo.wallet.chainId && (
                <div className="text-sm text-muted-foreground">
                  Current Chain: {debugInfo.wallet.chainId}
                  {debugInfo.wallet.chainId === '0x1B59' && (
                    <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-700">
                      ZetaChain Testnet
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Troubleshooting</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {!debugInfo.ethereum.available && (
                  <div>• Install MetaMask extension</div>
                )}
                {debugInfo.ethereum.available && !debugInfo.ethereum.isMetaMask && (
                  <div>• Make sure MetaMask is the active wallet</div>
                )}
                {debugInfo.ethereum.isMetaMask && !debugInfo.wallet.connected && (
                  <div>• Unlock MetaMask and connect account</div>
                )}
                {debugInfo.wallet.connected && debugInfo.wallet.chainId !== '0x1B59' && (
                  <div>• Switch to ZetaChain testnet in MetaMask</div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Debug timestamp: {debugInfo.timestamp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
