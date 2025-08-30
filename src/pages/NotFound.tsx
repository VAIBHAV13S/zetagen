import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="glass-card p-12">
            {/* 404 Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="w-32 h-32 mx-auto rounded-full glass flex items-center justify-center mb-6">
                <Search className="h-16 w-16 text-muted-foreground" />
              </div>
              <h1 className="text-8xl font-bold mb-4">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  404
                </span>
              </h1>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
              <p className="text-xl text-muted-foreground mb-2">
                Oops! The page you're looking for doesn't exist.
              </p>
              <p className="text-muted-foreground">
                The page at <code className="bg-muted px-2 py-1 rounded text-sm">{location.pathname}</code> could not be found.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={handleGoHome}
                size="lg"
                className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
              >
                <Home className="mr-2 h-5 w-5" />
                Go to Home
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </motion.div>

            {/* Additional Help */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 pt-8 border-t border-primary/20"
            >
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact support or try refreshing the page.
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound