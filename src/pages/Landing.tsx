import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { useSEO, seoConfigs } from '@/hooks/useSEO';
import { connectWallet } from '@/lib/wallet';
import { ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Landing = () => {
  const { isWalletConnected, connectWallet: setWalletConnected } = useStore();
  const { toast } = useToast();

  // SEO optimization
  useSEO(seoConfigs.home);

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletConnected(address);
      toast({
        title: "Wallet Connected!",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Create stunning digital assets using advanced AI models',
    },
    {
      icon: Globe,
      title: 'Cross-Chain Minting',
      description: 'Mint your assets across multiple blockchain networks',
    },
    {
      icon: Shield,
      title: 'Secure & Decentralized',
      description: 'Your assets are secured by blockchain technology',
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Create AI-generated digital assets and mint them cross-chain. 
                The future of decentralized content creation is here.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {isWalletConnected ? (
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 group"
                  >
                    <Link to="/generator">
                      Start Creating
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleConnectWallet}
                    size="lg" 
                    className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
                  >
                    Connect Wallet to Start
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                >
                  <Link to="/gallery">
                    Explore Gallery
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative glass-card p-4 rounded-2xl">
                <motion.img
                  src={heroImage}
                  alt="AI Asset Generation"
                  className="w-full h-auto rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-xl" />
              </div>
              
              {/* Floating elements */}
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
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Powered by <span className="bg-gradient-secondary bg-clip-text text-transparent">Advanced Technology</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of digital asset creation with our cutting-edge platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
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
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-2xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Ready to Create the <span className="bg-gradient-primary bg-clip-text text-transparent">Future</span>?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of creators already using Zeta-Gen to build the next generation of digital assets
              </p>
              {!isWalletConnected ? (
                <Button 
                  onClick={handleConnectWallet}
                  size="lg" 
                  className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 animate-glow-pulse"
                >
                  Get Started Now
                </Button>
              ) : (
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 animate-glow-pulse"
                >
                  <Link to="/generator">
                    Start Creating Assets
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;