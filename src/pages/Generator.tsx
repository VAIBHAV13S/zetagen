import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { useSEO, seoConfigs } from '@/hooks/useSEO';
import { connectWallet, watchAccountChanges, watchChainChanges } from '@/lib/wallet';
import { Sparkles, Loader2, Download, Share, Coins, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [suggestions] = useState([
    'Cyberpunk city with neon lights',
    'Abstract digital art with flowing particles',
    'Futuristic robot in a crystal environment',
    'Ethereal landscape with floating islands',
    'Holographic butterfly in space',
  ]);

  const { 
    currentAsset, 
    isGenerating, 
    isMinting, 
    isWalletConnected, 
    generateAsset, 
    mintAsset,
    connectWallet: setWalletConnected,
    disconnectWallet
  } = useStore();
  
  const { toast } = useToast();

  useSEO(seoConfigs.generator);

  // Watch for account and chain changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected",
          variant: "destructive"
        });
      } else {
        setWalletConnected(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      if (chainId !== '0x1B59') {
        toast({
          title: "Wrong Network",
          description: "Please switch to ZetaChain Athens Testnet",
          variant: "destructive"
        });
      }
    };

    watchAccountChanges(handleAccountsChanged);
    watchChainChanges(handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [setWalletConnected, disconnectWallet, toast]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe what you want to create",
        variant: "destructive"
      });
      return;
    }

    if (!isWalletConnected) {
      toast({
        title: "Connect your wallet",
        description: "You need to connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    try {
      await generateAsset(prompt);
      toast({
        title: "Asset generated!",
        description: "Your AI-powered asset has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate asset",
        variant: "destructive"
      });
    }
  }, [prompt, isWalletConnected, generateAsset, toast]);

  const handleMint = useCallback(async () => {
    if (!currentAsset) return;

    try {
      await mintAsset(currentAsset.id);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00D4FF', '#8B5FE6', '#FF0080']
      });

      toast({
        title: "NFT Minted!",
        description: "Your asset has been minted as an NFT successfully",
      });
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint asset",
        variant: "destructive"
      });
    }
  }, [currentAsset, mintAsset, toast]);

  const handleConnectWallet = useCallback(async () => {
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
  }, [setWalletConnected, toast]);

  const handleDownload = useCallback(async () => {
    if (!currentAsset?.imageUrl) {
      toast({
        title: "Download Failed",
        description: "No image available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(currentAsset.imageUrl, { 
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'image/*,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      let fileExtension = '.png';
      if (blob.type.includes('jpeg') || blob.type.includes('jpg')) {
        fileExtension = '.jpg';
      } else if (blob.type.includes('webp')) {
        fileExtension = '.webp';
      } else if (blob.type.includes('gif')) {
        fileExtension = '.gif';
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zetaforge-${currentAsset.id || 'asset'}${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Image saved as ${link.download}`,
      });

    } catch (error) {
      console.error('Download failed:', error);
      
      try {
        window.open(currentAsset.imageUrl, '_blank');
        toast({
          title: "Download Alternative",
          description: "Image opened in new tab. Right-click to save.",
        });
      } catch (fallbackError) {
        toast({
          title: "Download Failed",
          description: "Unable to download image. Try right-clicking the image to save.",
          variant: "destructive",
        });
      }
    }
  }, [currentAsset, toast]);

  const handleShare = useCallback(async () => {
    if (!currentAsset) return;

    const shareData = {
      title: `${currentAsset.metadata.name} - ZetaForge AI`,
      text: `Check out this AI-generated asset: "${currentAsset.prompt}"`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared Successfully",
          description: "Asset shared successfully",
        });
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Copied to Clipboard",
          description: "Share link copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to share. Please try again.",
        variant: "destructive"
      });
    }
  }, [currentAsset, toast]);

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
          <div className="mb-12">
            <Button 
              onClick={() => navigate('/')}
              variant="ghost" 
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>

            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  AI Asset Generator
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Transform your imagination into digital assets with the power of AI
              </p>
            </div>
          </div>

          {/* Generator Interface */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-card p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Sparkles className="mr-2 h-6 w-6 text-primary" />
                  Describe Your Vision
                </h2>

                {/* Prompt Input */}
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Enter your creative prompt..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="glass border-primary/30 focus:border-primary text-lg py-6"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                    />
                  </div>

                  {/* Suggestions */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => setPrompt(suggestion)}
                          className="px-3 py-1 text-sm glass border border-primary/20 rounded-full hover:border-primary/50 hover:bg-primary/10 transition-colors"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  {isWalletConnected ? (
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 py-6 text-lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating Asset...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Asset
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnectWallet}
                      className="w-full bg-gradient-secondary hover:shadow-glow-secondary transition-all duration-300 py-6 text-lg"
                    >
                      Connect Wallet to Generate
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="glass-card p-6 h-full">
                <h2 className="text-2xl font-semibold mb-6">Preview</h2>

                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-64 space-y-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-pulse border-t-secondary" />
                      </div>
                      <p className="text-muted-foreground">Creating your digital asset...</p>
                    </motion.div>
                  ) : currentAsset ? (
                    <motion.div
                      key="asset"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="space-y-4"
                    >
                      {/* Generated Image */}
                      <div className="relative group">
                        <img
                          src={currentAsset.imageUrl}
                          alt={currentAsset.prompt}
                          className="w-full rounded-lg shadow-glass"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x400/f0f0f0/666?text=Image+Not+Available';
                          }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity rounded-lg" />
                      </div>

                      {/* Asset Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{currentAsset.metadata.name}</h3>
                        <p className="text-sm text-muted-foreground">{currentAsset.prompt}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-primary/30"
                            onClick={handleDownload}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-primary/30"
                            onClick={handleShare}
                          >
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </div>

                        {/* Mint Button */}
                        <Button
                          onClick={handleMint}
                          disabled={isMinting || currentAsset.isMinted}
                          className="w-full bg-gradient-secondary hover:shadow-glow-secondary transition-all duration-300"
                        >
                          {isMinting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Minting NFT...
                            </>
                          ) : currentAsset.isMinted ? (
                            'Already Minted ✓'
                          ) : (
                            <>
                              <Coins className="mr-2 h-4 w-4" />
                              Mint as NFT
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-64 space-y-4 text-center"
                    >
                      <div className="w-16 h-16 rounded-full glass flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">Your generated asset will appear here</p>
                        <p className="text-sm text-muted-foreground/70">Enter a prompt and click generate to get started</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Generator;