import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Zap,
  Coins,
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SUPPORTED_CHAINS } from '@/lib/gateway';

interface GatewayFeaturesProps {
  asset: any;
  onDeploymentComplete?: (universalAsset: any) => void;
}

const GatewayFeatures: React.FC<GatewayFeaturesProps> = ({
  asset,
  onDeploymentComplete
}) => {
  const {
    selectedTargetChains,
    setSelectedTargetChains,
    deployAssetMultiChain,
    processStZetaPayment,
    getCrossChainQuote,
    isDeployingMultiChain,
    isProcessingPayment,
    walletAddress
  } = useStore();

  const { toast } = useToast();
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);

  const handleChainToggle = (chainId: number) => {
    const newChains = selectedTargetChains.includes(chainId)
      ? selectedTargetChains.filter(id => id !== chainId)
      : [...selectedTargetChains, chainId];
    setSelectedTargetChains(newChains);
  };

  const handleGetQuote = async () => {
    if (selectedTargetChains.length === 0) {
      toast({
        title: "Select Chains",
        description: "Please select at least one target chain",
        variant: "destructive"
      });
      return;
    }

    setIsGettingQuote(true);
    try {
      // Get quote for stZETA transfer from ZetaChain to the first selected chain
      const quoteResult = await getCrossChainQuote(
        'stZETA',
        '0.01', // Sample amount
        7001, // ZetaChain
        selectedTargetChains[0]
      );
      setQuote(quoteResult);
      setShowQuote(true);
    } catch (error: any) {
      toast({
        title: "Quote Failed",
        description: error.message || "Failed to get cross-chain quote",
        variant: "destructive"
      });
    } finally {
      setIsGettingQuote(false);
    }
  };

  const handleMultiChainDeploy = async () => {
    if (!asset) {
      toast({
        title: "No Asset",
        description: "Please generate an asset first",
        variant: "destructive"
      });
      return;
    }

    if (selectedTargetChains.length === 0) {
      toast({
        title: "Select Chains",
        description: "Please select at least one target chain",
        variant: "destructive"
      });
      return;
    }

    try {
      const universalAsset = await deployAssetMultiChain(asset);
      toast({
        title: "Multi-Chain Deployment Complete!",
        description: `Asset deployed to ${universalAsset.deployments.length} chains`,
      });
      onDeploymentComplete?.(universalAsset);
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy asset",
        variant: "destructive"
      });
    }
  };

  const handleStZetaPayment = async () => {
    try {
      const payment = await processStZetaPayment('0.01', 'generation');
      toast({
        title: "Payment Processed!",
        description: `stZETA payment completed: ${payment.paymentId}`,
      });
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  const getChainInfo = (chainId: number) => {
    return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Multi-Chain Deployment */}
      <Card className="glass-card p-6">
        <div className="flex items-center mb-4">
          <Globe className="mr-3 h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">Multi-Chain Deployment</h3>
        </div>

        <p className="text-muted-foreground mb-4">
          Deploy your AI-generated asset simultaneously across multiple blockchain networks
        </p>

        {/* Chain Selection */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium">Select Target Chains:</h4>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_CHAINS.map((chain) => (
              <div key={chain.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`chain-${chain.id}`}
                  checked={selectedTargetChains.includes(chain.id)}
                  onCheckedChange={() => handleChainToggle(chain.id)}
                />
                <label
                  htmlFor={`chain-${chain.id}`}
                  className="flex items-center space-x-2 cursor-pointer flex-1"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    chain.id === 1 ? 'bg-blue-500' :
                    chain.id === 56 ? 'bg-yellow-500' :
                    chain.id === 137 ? 'bg-purple-500' :
                    chain.id === 43114 ? 'bg-red-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-sm font-medium">{chain.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {chain.symbol}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Chains Summary */}
        {selectedTargetChains.length > 0 && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-primary font-medium">
              Selected: {selectedTargetChains.map(id => getChainInfo(id)?.name).join(', ')}
            </p>
            <p className="text-xs text-muted-foreground">
              Asset will be deployed to {selectedTargetChains.length} blockchain network{selectedTargetChains.length > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Deploy Button */}
        <Button
          onClick={handleMultiChainDeploy}
          disabled={isDeployingMultiChain || selectedTargetChains.length === 0}
          className="w-full bg-gradient-primary hover:shadow-glow-primary"
        >
          {isDeployingMultiChain ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying to {selectedTargetChains.length} Chains...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Deploy Multi-Chain ({selectedTargetChains.length} chains)
            </>
          )}
        </Button>
      </Card>

      {/* Cross-Chain Payment Gateway */}
      <Card className="glass-card p-6">
        <div className="flex items-center mb-4">
          <Coins className="mr-3 h-6 w-6 text-secondary" />
          <h3 className="text-xl font-semibold">stZETA Payment Gateway</h3>
        </div>

        <p className="text-muted-foreground mb-4">
          Process payments using stZETA tokens across multiple chains
        </p>

        {/* Quote Section */}
        <div className="space-y-4 mb-6">
          <Button
            variant="outline"
            onClick={handleGetQuote}
            disabled={isGettingQuote || selectedTargetChains.length === 0}
            className="w-full border-primary/30"
          >
            {isGettingQuote ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Get Cross-Chain Quote
              </>
            )}
          </Button>

          {showQuote && quote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-secondary/10 rounded-lg border border-secondary/20"
            >
              <h4 className="font-medium mb-2">Transfer Quote (0.01 stZETA)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Estimated Gas:</span>
                  <span>{quote.estimatedGas} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Time:</span>
                  <span>{Math.round(quote.estimatedTime / 60)} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee:</span>
                  <span>{quote.fee} stZETA</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span>{quote.exchangeRate}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Payment Button */}
        <Button
          onClick={handleStZetaPayment}
          disabled={isProcessingPayment}
          className="w-full bg-gradient-secondary hover:shadow-glow-secondary"
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Process stZETA Payment (0.01)
            </>
          )}
        </Button>
      </Card>

      {/* Universal Asset Bridge */}
      <Card className="glass-card p-6">
        <div className="flex items-center mb-4">
          <ArrowRightLeft className="mr-3 h-6 w-6 text-accent" />
          <h3 className="text-xl font-semibold">Universal Asset Bridge</h3>
        </div>

        <p className="text-muted-foreground mb-4">
          Seamlessly bridge your assets between different blockchain networks
        </p>

        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <ArrowRightLeft className="h-6 w-6 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">
            Bridge functionality will be available after multi-chain deployment
          </p>
        </div>
      </Card>

      {/* Innovation Highlights */}
      <Card className="glass-card p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">🏆 Hackathon Prize Features</h3>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="outline" className="border-primary/30">
              <CheckCircle className="mr-1 h-3 w-3" />
              Multi-Chain Deployment
            </Badge>
            <Badge variant="outline" className="border-secondary/30">
              <CheckCircle className="mr-1 h-3 w-3" />
              stZETA Payments
            </Badge>
            <Badge variant="outline" className="border-accent/30">
              <CheckCircle className="mr-1 h-3 w-3" />
              Universal Asset Bridge
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            These features showcase innovative Gateway API integration for cross-chain functionality
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default GatewayFeatures;
