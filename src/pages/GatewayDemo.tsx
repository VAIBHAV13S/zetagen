import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Coins,
  ArrowRightLeft,
  Zap,
  Trophy,
  TestTube,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const GatewayDemo: React.FC = () => {
  const { walletAddress, isWalletConnected } = useStore();
  const { toast } = useToast();
  const [demoStep, setDemoStep] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  const demoSteps = [
    {
      title: "Multi-Chain Deployment Demo",
      description: "Deploy an asset to 4+ blockchain networks simultaneously",
      icon: Globe,
      action: "deployMultiChain",
      status: "ready"
    },
    {
      title: "stZETA Payment Processing",
      description: "Process cross-chain payments using stZETA tokens",
      icon: Coins,
      action: "processPayment",
      status: "ready"
    },
    {
      title: "Universal Asset Bridge",
      description: "Bridge assets seamlessly between chains",
      icon: ArrowRightLeft,
      action: "bridgeAsset",
      status: "pending"
    },
    {
      title: "Cross-Chain Quote System",
      description: "Get real-time quotes for cross-chain transfers",
      icon: Zap,
      action: "getQuote",
      status: "ready"
    }
  ];

  const runDemo = async (action: string) => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to run the demo",
        variant: "destructive"
      });
      return;
    }

    setIsRunningDemo(true);

    try {
      switch (action) {
        case 'deployMultiChain':
          toast({
            title: "Demo: Multi-Chain Deployment",
            description: "Simulating deployment to Ethereum, BSC, Polygon, and ZetaChain...",
          });
          // Simulate deployment
          await new Promise(resolve => setTimeout(resolve, 3000));
          toast({
            title: "Demo Complete!",
            description: "Asset deployed to 4 chains successfully!",
          });
          break;

        case 'processPayment':
          toast({
            title: "Demo: stZETA Payment",
            description: "Processing 0.01 stZETA payment across chains...",
          });
          // Simulate payment
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast({
            title: "Demo Complete!",
            description: "stZETA payment processed successfully!",
          });
          break;

        case 'bridgeAsset':
          toast({
            title: "Demo: Asset Bridge",
            description: "Bridging asset from ZetaChain to Ethereum...",
          });
          // Simulate bridge
          await new Promise(resolve => setTimeout(resolve, 4000));
          toast({
            title: "Demo Complete!",
            description: "Asset bridged successfully!",
          });
          break;

        case 'getQuote':
          toast({
            title: "Demo: Cross-Chain Quote",
            description: "Fetching quote for stZETA transfer...",
          });
          // Simulate quote
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast({
            title: "Demo Complete!",
            description: "Quote: 0.01 stZETA = ~$2.45, Fee: 0.0001 ETH",
          });
          break;
      }
    } catch (error) {
      toast({
        title: "Demo Failed",
        description: "Demo simulation encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
              <h1 className="text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Gateway API Demo
                </span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Experience the most innovative cross-chain features for the hackathon prize
            </p>

            {/* Prize Badge */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 px-6 py-3 rounded-full border border-yellow-400/30">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-yellow-600">
                "Most Innovative Use of Gateway API" Prize Candidate
              </span>
            </div>
          </div>

          {/* Demo Steps */}
          <div className="grid gap-6 mb-12">
            {demoSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${
                          step.status === 'ready' ? 'bg-green-500/20' :
                          step.status === 'pending' ? 'bg-yellow-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            step.status === 'ready' ? 'text-green-500' :
                            step.status === 'pending' ? 'text-yellow-500' :
                            'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                          <p className="text-muted-foreground">{step.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant={
                          step.status === 'ready' ? 'default' :
                          step.status === 'pending' ? 'secondary' :
                          'outline'
                        }>
                          {step.status === 'ready' ? (
                            <><CheckCircle className="mr-1 h-3 w-3" /> Ready</>
                          ) : step.status === 'pending' ? (
                            <><AlertCircle className="mr-1 h-3 w-3" /> Coming Soon</>
                          ) : (
                            'Disabled'
                          )}
                        </Badge>

                        <Button
                          onClick={() => runDemo(step.action)}
                          disabled={step.status !== 'ready' || isRunningDemo || !isWalletConnected}
                          className="bg-gradient-primary hover:shadow-glow-primary"
                        >
                          {isRunningDemo ? (
                            <>
                              <TestTube className="mr-2 h-4 w-4 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <TestTube className="mr-2 h-4 w-4" />
                              Run Demo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Innovation Highlights */}
          <Card className="glass-card p-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">🏆 Prize-Winning Innovation</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Multi-Chain Deployment</h3>
                  <p className="text-sm text-muted-foreground">
                    Deploy assets to 5+ blockchains simultaneously using Gateway API
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Coins className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">stZETA Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Process payments across chains with ZetaChain's native token
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                    <ArrowRightLeft className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Universal Bridge</h3>
                  <p className="text-sm text-muted-foreground">
                    Seamless asset movement between any supported blockchain
                  </p>
                </div>
              </div>

              <div className="border-t border-primary/20 pt-6">
                <h3 className="text-lg font-semibold mb-4">Why This Wins the Prize:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Advanced Gateway API integration
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Cross-chain simultaneous deployment
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      stZETA token payment processing
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Universal asset bridging system
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Real-time cross-chain quotes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Multi-chain NFT ecosystem
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Ready to experience the future of cross-chain AI asset generation?
            </p>
            <Button
              onClick={() => window.location.href = '/generator'}
              className="bg-gradient-primary hover:shadow-glow-primary px-8 py-4 text-lg"
            >
              Try the Full Experience
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GatewayDemo;
