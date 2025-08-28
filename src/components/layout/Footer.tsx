import { motion } from 'framer-motion';
import { Github, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const footerLinks = [
    {
      title: 'GitHub',
      url: 'https://github.com',
      icon: Github,
    },
    {
      title: 'ZetaChain Docs',
      url: 'https://docs.zetachain.com',
      icon: ExternalLink,
    },
    {
      title: 'Google Gemini Docs',
      url: 'https://ai.google.dev/docs',
      icon: ExternalLink,
    },
  ];

  return (
    <motion.footer 
      initial={{ y: 100 }}
      whileInView={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-card border-t border-primary/20 mt-20"
    >
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Description */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div className="flex items-center space-x-2">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-2 rounded-lg bg-gradient-primary"
              >
                <Zap className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Zeta-Gen
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left max-w-md">
              AI-Powered Universal Asset Generator for the decentralized future
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-4">
            {footerLinks.map((link) => (
              <motion.div key={link.title} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2"
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{link.title}</span>
                  </a>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-6" />

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Zeta-Gen. Built with AI, powered by blockchain.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;