import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore, type Asset } from '@/store/useStore';
import { Search, Filter, ExternalLink, Copy, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSEO, seoConfigs } from '@/hooks/useSEO';

const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { assets, galleryFilter, setGalleryFilter, walletAddress, fetchAssets } = useStore();
  const { toast } = useToast();

  useSEO(seoConfigs.gallery);

  // Fetch assets when component mounts
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = useMemo(() => {
    let filtered = assets;

    if (galleryFilter === 'my-assets') {
      filtered = filtered.filter(asset => asset.owner === walletAddress);
    } else if (galleryFilter === 'trending') {
      filtered = filtered.filter(asset => asset.isMinted);
    }

    if (searchQuery) {
      filtered = filtered.filter(asset => 
        asset.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.metadata.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [assets, galleryFilter, searchQuery, walletAddress]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAssets();
      toast({
        title: "Gallery Refreshed",
        description: "Asset gallery has been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed", 
        description: "Failed to refresh gallery",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAssets, toast]);

  const filterButtons = useMemo(() => [
    { key: 'all' as const, label: 'All Assets', count: assets.length },
    { key: 'my-assets' as const, label: 'My Assets', count: assets.filter(a => a.owner === walletAddress).length },
    { key: 'trending' as const, label: 'Trending', count: assets.filter(a => a.isMinted).length },
  ], [assets, walletAddress]);

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={() => navigate('/')}
              variant="ghost" 
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            
            <Button 
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="mb-4"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Asset Gallery
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover and explore AI-generated digital assets from the community
            </p>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {filterButtons.map((filter) => (
                  <Button
                    key={filter.key}
                    variant={galleryFilter === filter.key ? "default" : "outline"}
                    onClick={() => setGalleryFilter(filter.key)}
                    className={
                      galleryFilter === filter.key
                        ? "bg-gradient-primary hover:shadow-glow-primary"
                        : "border-primary/30 hover:bg-primary/10"
                    }
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {filter.label}
                    <Badge variant="secondary" className="ml-2">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass border-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Assets Grid */}
        <AnimatePresence>
          {filteredAssets.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: Math.min(index * 0.05, 0.5),
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="glass-card overflow-hidden hover:shadow-glow-primary transition-all duration-300">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={asset.imageUrl}
                        alt={asset.metadata.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                      
                      {asset.isMinted && (
                        <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Minted
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg truncate">{asset.metadata.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{asset.prompt}</p>
                      </div>

                      {/* Owner */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Owner</p>
                          <button
                            onClick={() => copyToClipboard(asset.owner, 'Address')}
                            className="text-sm font-mono hover:text-primary transition-colors flex items-center"
                          >
                            {asset.owner.slice(0, 6)}...{asset.owner.slice(-4)}
                            <Copy className="ml-1 h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm">
                            {new Date(asset.metadata.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Transaction Hash */}
                      {asset.metadata.transactionHash && (
                        <div className="pt-2 border-t border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                          <button
                            onClick={() => copyToClipboard(asset.metadata.transactionHash!, 'Transaction hash')}
                            className="text-xs font-mono hover:text-primary transition-colors flex items-center"
                          >
                            {asset.metadata.transactionHash.slice(0, 8)}...{asset.metadata.transactionHash.slice(-6)}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="glass-card p-12 rounded-2xl max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full glass mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No assets found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search terms or filters" 
                    : "No assets match the current filter"}
                </p>
                <Button 
                  onClick={() => navigate('/generator')}
                  className="bg-gradient-primary hover:shadow-glow-primary"
                >
                  Create Your First Asset
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Gallery;