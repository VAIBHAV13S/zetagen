import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useToast } from '@/hooks/use-toast';
import { connectWallet } from '@/lib/wallet';
import { Zap, Wallet, LogOut } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { isWalletConnected, walletAddress, connectWallet: setWalletConnected, disconnectWallet } = useStore();
  const { toast } = useToast();

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
                className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
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