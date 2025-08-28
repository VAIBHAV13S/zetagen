import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonical?: string;
}

export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    // Update title
    if (config.title) {
      document.title = `${config.title} | ZetaForge AI`;
    }

    // Update meta description
    if (config.description) {
      updateMetaTag('description', config.description);
    }

    // Update keywords
    if (config.keywords) {
      updateMetaTag('keywords', config.keywords);
    }

    // Update Open Graph tags
    if (config.ogTitle) {
      updateMetaTag('og:title', config.ogTitle, 'property');
    }

    if (config.ogDescription) {
      updateMetaTag('og:description', config.ogDescription, 'property');
    }

    if (config.ogImage) {
      updateMetaTag('og:image', config.ogImage, 'property');
    }

    // Update Twitter tags
    if (config.twitterTitle) {
      updateMetaTag('twitter:title', config.twitterTitle);
    }

    if (config.twitterDescription) {
      updateMetaTag('twitter:description', config.twitterDescription);
    }

    // Update canonical URL
    if (config.canonical) {
      updateCanonicalLink(config.canonical);
    }

    // Update structured data
    updateStructuredData(config);
  }, [config]);
};

const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.content = content;
};

const updateCanonicalLink = (url: string) => {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  
  element.href = url;
};

const updateStructuredData = (config: SEOConfig) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": config.title || "ZetaForge AI",
    "description": config.description || "AI-powered digital asset generator",
    "url": config.canonical || window.location.href,
    "isPartOf": {
      "@type": "WebSite",
      "name": "ZetaForge AI",
      "url": "https://zetaforge-ai.com"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://zetaforge-ai.com/gallery?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  let element = document.querySelector('script[type="application/ld+json"][data-page]') as HTMLScriptElement;
  
  if (!element) {
    element = document.createElement('script');
    element.type = 'application/ld+json';
    element.setAttribute('data-page', 'true');
    document.head.appendChild(element);
  }
  
  element.textContent = JSON.stringify(structuredData);
};

// Page-specific SEO configurations
export const seoConfigs = {
  home: {
    title: "AI-Powered NFT Generator on ZetaChain",
    description: "Create stunning AI-generated digital assets using Gemini 2.0 Flash and mint them as NFTs on ZetaChain blockchain. Free AI art generator with blockchain integration.",
    keywords: "AI NFT generator, ZetaChain NFT, Gemini AI art, free AI art generator, blockchain NFT creator, AI-powered assets, Web3 art platform",
    ogTitle: "ZetaForge AI | Create & Mint AI-Powered NFTs on ZetaChain",
    ogDescription: "The ultimate AI-to-NFT platform. Generate stunning digital assets with advanced AI and mint them on ZetaChain blockchain.",
    twitterTitle: "Create AI-Powered NFTs with ZetaForge AI",
    twitterDescription: "Generate stunning digital assets with AI and mint them as NFTs on ZetaChain blockchain.",
    canonical: "https://zetaforge-ai.com/"
  },
  generator: {
    title: "AI Asset Generator - Create Digital Art with AI",
    description: "Generate unique digital assets using advanced AI technology. Transform your ideas into stunning visuals with our Gemini 2.0 Flash powered generator.",
    keywords: "AI art generator, digital asset creation, AI image generator, Gemini AI, prompt-based art, AI creativity tools",
    ogTitle: "AI Asset Generator | ZetaForge AI",
    ogDescription: "Create stunning digital assets with AI. Use natural language prompts to generate unique artwork powered by Gemini 2.0 Flash.",
    twitterTitle: "Generate AI Art with ZetaForge",
    twitterDescription: "Transform your ideas into stunning digital assets using advanced AI technology.",
    canonical: "https://zetaforge-ai.com/generator"
  },
  gallery: {
    title: "NFT Gallery - Explore AI-Generated Digital Assets",
    description: "Explore a collection of AI-generated digital assets minted as NFTs on ZetaChain. Discover unique artwork created by the community.",
    keywords: "NFT gallery, AI art collection, ZetaChain NFTs, digital art marketplace, AI-generated assets, blockchain art",
    ogTitle: "NFT Gallery | ZetaForge AI",
    ogDescription: "Explore stunning AI-generated NFTs minted on ZetaChain blockchain. Discover unique digital assets created by our community.",
    twitterTitle: "Explore AI-Generated NFTs",
    twitterDescription: "Discover unique AI-generated digital assets minted on ZetaChain blockchain.",
    canonical: "https://zetaforge-ai.com/gallery"
  }
};

export default useSEO;
