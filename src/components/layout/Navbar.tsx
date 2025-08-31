import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { isMetaMaskInstalled } from '@/lib/wallet';
import { Zap, Wallet, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { isWalletConnected, walletAddress, connectWalletAsync, isConnectingWallet, disconnectWallet } = useStore();
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    if (isConnectingWallet) {
      console.log('🔄 Connection already in progress, ignoring click');
      return;
    }
    
    try {
      // Check if MetaMask is installed
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
      
      let errorMessage = "Failed to connect wallet. Please try again.";
      let shouldRetry = false;
      
      if (error.message.includes('MetaMask not found')) {
        errorMessage = "MetaMask extension not found. Please install MetaMask.";
      } else if (error.message.includes('User rejected')) {
        errorMessage = "Wallet connection was cancelled by user.";
      } else if (error.message.includes('No accounts found')) {
        errorMessage = "No accounts found. Please unlock MetaMask and try again.";
      } else if (error.message.includes('ZetaChain network')) {
        errorMessage = "Failed to switch to ZetaChain network. Please add it manually in MetaMask.";
      } else if (error.message.includes('Wallet connection already in progress')) {
        errorMessage = "Please wait for the current connection attempt to complete.";
        shouldRetry = true;
      } else if (error.message.includes('MetaMask is busy')) {
        errorMessage = "MetaMask is currently busy. Please wait a moment and try again.";
        shouldRetry = true;
      } else if (error.message.includes('Already processing')) {
        errorMessage = "MetaMask is processing another request. Please wait and try again.";
        shouldRetry = true;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive"
      });

      // Auto-retry for certain errors after a delay
      if (shouldRetry) {
        setTimeout(async () => {
          try {
            console.log('🔄 Auto-retrying wallet connection...');
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
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-2 rounded-lg bg-gradient-primary"
            >
              <Zap className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Zeta-Gen
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" isActive={isActive('/')}>
              Home
            </NavLink>
            <NavLink to="/generator" isActive={isActive('/generator')}>
              Generator
            </NavLink>
            <NavLink to="/gallery" isActive={isActive('/gallery')}>
              Gallery
            </NavLink>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isWalletConnected ? (
              <div className="flex items-center space-x-3">
                <div className="glass-card px-3 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWallet}
                  className="border-destructive/50 hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnectingWallet}
                className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
              >
                {isConnectingWallet ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
}

const NavLink = ({ to, isActive, children }: NavLinkProps) => (
  <Link to={to} className="relative group">
    <motion.span
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
      whileHover={{ y: -2 }}
    >
      {children}
    </motion.span>
    {isActive && (
      <motion.div
        layoutId="activeTab"
        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-primary rounded-full"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
  </Link>
);

export default Navbar;