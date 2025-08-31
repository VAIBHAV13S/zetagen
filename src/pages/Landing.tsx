import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { useSEO, seoConfigs } from '@/hooks/useSEO';
import { isMetaMaskInstalled } from '@/lib/wallet';
import { WalletStatus } from '@/components/ui/wallet-status';
import { WalletDebug } from '@/components/ui/wallet-debug';
import { ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: "easeOut" }
};

const fadeInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, delay: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isWalletConnected, walletAddress, connectWallet: setWalletConnected, connectWalletAsync, isConnectingWallet } = useStore();
  const { toast } = useToast();

  useSEO(seoConfigs.home);

  const features = useMemo(() => [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Create stunning digital assets using advanced AI models with state-of-the-art algorithms',
    },
    {
      icon: Globe,
      title: 'Cross-Chain Minting',
      description: 'Seamlessly mint your assets across multiple blockchain networks with one click',
    },
    {
      icon: Shield,
      title: 'Secure & Decentralized',
      description: 'Your assets are protected by blockchain technology and distributed infrastructure',
    },
  ], []);

  const handleConnectWallet = useCallback(async () => {
    if (isConnectingWallet) {
      console.log('🔄 Connection already in progress, ignoring click');
      return;
    }
    
    try {
      if (!isMetaMaskInstalled()) {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask extension to connect your wallet.",
          variant: "destructive"
        });
        return;
      }

      await connectWalletAsync();
      
      toast({
        title: "Wallet Connected!",
        description: `Connected to ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      const getErrorMessage = (error: any): string => {
        if (error.message?.includes('MetaMask not found')) {
          return "MetaMask extension not found. Please install MetaMask.";
        }
        if (error.message?.includes('User rejected')) {
          return "Wallet connection was cancelled by user.";
        }
        if (error.message?.includes('No accounts found')) {
          return "No accounts found. Please unlock MetaMask and try again.";
        }
        if (error.message?.includes('ZetaChain network')) {
          return "Failed to switch to ZetaChain network. Please add it manually in MetaMask.";
        }
        if (error.message?.includes('Wallet connection already in progress')) {
          return "Please wait for the current connection attempt to complete.";
        }
        if (error.message?.includes('MetaMask is busy')) {
          return "MetaMask is currently busy. Please wait a moment and try again.";
        }
        if (error.message?.includes('Already processing')) {
          return "MetaMask is processing another request. Please wait and try again.";
        }
        return error.message || "Failed to connect wallet. Please try again.";
      };
      
      const errorMessage = getErrorMessage(error);
      const shouldRetry = errorMessage.includes('busy') || errorMessage.includes('processing') || errorMessage.includes('in progress');
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });

      // Auto-retry for certain errors after a delay
      if (shouldRetry) {
        setTimeout(async () => {
          try {
            console.log('🔄 Auto-retrying wallet connection from Landing...');
            await connectWalletAsync();
            toast({
              title: "Wallet Connected!",
              description: `Connected to ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`,
            });
          } catch (retryError) {
            console.error('Auto-retry failed:', retryError);
          }
        }, 3000);
      }
    }
  }, [toast, connectWalletAsync, walletAddress, isConnectingWallet]);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleStartCreating = useCallback(() => {
    if (isWalletConnected) {
      navigate('/generator');
    } else {
      handleConnectWallet();
    }
  }, [isWalletConnected, navigate, handleConnectWallet]);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              variants={fadeInLeft}
              initial="initial"
              animate="animate"
              className="space-y-8"
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold leading-tight"
                variants={fadeInUp}
              >
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Zeta-Gen:
                </span>
                <br />
                <span className="text-foreground">
                  AI-Powered Universal Asset Generator
                </span>
              </motion.h1>

              <motion.p 
                className="text-xl text-muted-foreground max-w-lg leading-relaxed"
                variants={fadeInUp}
              >
                Create AI-generated digital assets and mint them cross-chain. 
                The future of decentralized content creation is here.
              </motion.p>

              <motion.div variants={fadeInUp}>
                <WalletStatus 
                  isConnected={isWalletConnected} 
                  walletAddress={walletAddress} 
                />
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                variants={fadeInUp}
              >
                <Button 
                  onClick={handleStartCreating}
                  size="lg" 
                  className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 group"
                >
                  {isWalletConnected ? 'Start Creating' : 'Connect Wallet to Start'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  onClick={() => handleNavigation('/gallery')}
                  variant="outline" 
                  size="lg" 
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                >
                  Explore Gallery
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              variants={fadeInRight}
              initial="initial"
              animate="animate"
              className="relative"
            >
              <div className="relative glass-card p-4 rounded-2xl">
                <motion.img
                  src={heroImage}
                  alt="AI Asset Generation Preview"
                  className="w-full h-auto rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-xl" />
              </div>
              
              <motion.div
                className="absolute -top-4 -right-4 glass-card p-3 rounded-lg"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap className="h-6 w-6 text-primary" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Powered by{' '}
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Advanced Technology
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of digital asset creation with our cutting-edge platform
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="glass-card p-8 h-full hover:shadow-glow-primary transition-all duration-300">
                  <div className="mb-6">
                    <div className="inline-flex p-3 rounded-lg bg-gradient-primary/10 group-hover:bg-gradient-primary/20 transition-colors">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Wallet Debug Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Having{' '}
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Connection Issues
              </span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Use our diagnostic tool to troubleshoot wallet connection problems
            </p>
          </motion.div>

          <div className="flex justify-center">
            <WalletDebug />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="glass-card p-12 rounded-2xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Create the{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Future
                </span>?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of creators already using Zeta-Gen to build the next generation of digital assets
              </p>
              
              <Button 
                onClick={handleStartCreating}
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 animate-glow-pulse"
              >
                {isWalletConnected ? 'Start Creating Assets' : 'Get Started Now'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;