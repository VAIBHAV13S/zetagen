import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is required. Please add it to your .env file.');
}

class EnhancedGeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    
    // Use different models for different tasks
    this.textModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: this.getSafetySettings()
    });

    // Optimized model for metadata generation (more structured)
    this.metadataModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7, // Lower temperature for more consistent JSON
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
      safetySettings: this.getSafetySettings()
    });

    // Cache for common requests
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  getSafetySettings() {
    return [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
  }

  // Native Gemini image generation (preferred) with Pollinations.ai fallback
  async generateImage(prompt, style = 'digital-art', quality = 'ultra-high') {
    console.log(`🎨 Generating AI image for: "${prompt}"`);

    try {
      const cacheKey = `image_${prompt}_${style}_${quality}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('🔄 Returning cached image result');
        return cached;
      }

      // Style-specific prompt templates
      const styleTemplates = {
        'digital-art': 'digital artwork, highly detailed, vibrant colors, professional digital painting',
        'photorealistic': 'photorealistic, 8K resolution, professional photography, studio lighting',
        'anime': 'anime style, detailed illustration, vibrant colors, manga inspired',
        'fantasy': 'fantasy art, magical atmosphere, ethereal lighting, mystical elements',
        'cyberpunk': 'cyberpunk aesthetic, neon lighting, futuristic cityscape, high-tech elements',
        'abstract': 'abstract art, creative composition, artistic interpretation, unique perspective'
      };

      const qualityModifiers = {
        'ultra-high': 'masterpiece, best quality, ultra-detailed, 8K resolution, professional grade',
        'high': 'high quality, detailed, well-composed, professional',
        'medium': 'good quality, clear details, well-balanced'
      };

      // Create enhanced prompt
      const enhancedPrompt = `${prompt}, ${styleTemplates[style] || styleTemplates['digital-art']}, ${qualityModifiers[quality] || qualityModifiers['high']}, perfect composition, optimal lighting, rich details, creative perspective, emotional depth, visual impact.`;
      
      console.log('🎯 Enhanced prompt created');
      console.log('📝 Prompt preview:', enhancedPrompt.substring(0, 100) + '...');

      // Try Gemini native image generation first
      try {
        console.log('🔮 Attempting Gemini native image generation...');
        const imageModel = this.genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
          }
        });

        // Try to generate image directly with Gemini
        const imageResult = await imageModel.generateContent([
          {
            text: `Generate a high-quality image: ${enhancedPrompt}`
          }
        ]);

        // Check if Gemini returned an image
        const response = imageResult.response;
        if (response && response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0];
          
          // Look for image data in the response
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                // Convert base64 image to data URL
                const mimeType = part.inlineData.mimeType || 'image/png';
                const imageDataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
                
                console.log('✅ Gemini native image generation successful!');
                
                const result_data = {
                  imageURL: imageDataUrl,
                  enhancedPrompt,
                  originalPrompt: prompt,
                  style,
                  quality,
                  generator: 'Gemini Native',
                  format: 'base64'
                };

                this.setCache(cacheKey, result_data);
                return result_data;
              }
            }
          }
        }
        
        console.log('⚠️ Gemini native generation not available, falling back to external service...');
        
      } catch (geminiError) {
        console.log('⚠️ Gemini native generation failed:', geminiError.message);
        console.log('� Falling back to external image generation service...');
      }

      // Fallback to multiple external image generation services
      const imageGenerators = [
        {
          name: 'Pollinations.ai (Simple)',
          url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`
        },
        {
          name: 'Pollinations.ai (Enhanced)',
          url: `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&model=flux&nologo=true`
        },
        {
          name: 'Alternative Image Service',
          url: `https://api.limewire.com/api/image/generation?prompt=${encodeURIComponent(prompt)}&aspect_ratio=1:1&quality=HIGH&style=PHOTOREALISTIC`
        },
        {
          name: 'Pollinations.ai (Turbo)',
          url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=turbo&nologo=true`
        }
      ];

      let imageURL;
      let usedGenerator;
      let fallbackURL;
      
      for (let i = 0; i < imageGenerators.length; i++) {
        const generator = imageGenerators[i];
        try {
          const testURL = generator.url;
          // Test if URL is accessible
          const response = await fetch(testURL, { method: 'HEAD', timeout: 10000 });
          if (response.ok) {
            console.log(`✅ Image generated successfully using ${generator.name}`);
            imageURL = testURL;
            usedGenerator = generator.name;
            
            // Set fallback to next working service
            if (i + 1 < imageGenerators.length) {
              fallbackURL = imageGenerators[i + 1].url;
            }
            break;
          }
        } catch (error) {
          console.warn(`⚠️ ${generator.name} failed, trying next option...`);
          continue;
        }
      }

      if (!imageURL) {
        throw new Error('All image generation services failed');
      }

      // Create proxy URL to serve through our backend (avoids CORS issues)
      const baseURL = process.env.BASE_URL || 'http://localhost:5000';
      let proxyURL = `${baseURL}/api/image/proxy-image?url=${encodeURIComponent(imageURL)}`;
      
      // Add fallback if available
      if (fallbackURL) {
        proxyURL += `&fallback=${encodeURIComponent(fallbackURL)}`;
      }

      console.log('🔗 Created proxy URL for reliable image serving');

      const result_data = {
        imageURL: proxyURL, // Use proxy URL instead of direct URL
        originalURL: imageURL, // Keep original for reference
        fallbackURL: fallbackURL,
        enhancedPrompt,
        originalPrompt: prompt,
        style,
        quality,
        generator: usedGenerator || 'External Service',
        format: 'proxy'
      };

      this.setCache(cacheKey, result_data);
      return result_data;

    } catch (error) {
      console.error('❌ Error during AI image generation:', error);
      throw new Error(`Failed to generate AI image: ${error.message}`);
    }
  }

  // Enhanced metadata generation with better structure
  async generateMetadata(prompt, assetType = 'artwork') {
    console.log(`📝 Generating enhanced AI metadata for: "${prompt}"`);

    try {
      const cacheKey = `metadata_${prompt}_${assetType}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('🔄 Returning cached metadata result');
        return cached;
      }

      // Asset type specific templates
      const typeTemplates = {
        'artwork': {
          traits: ['Style', 'Medium', 'Color Palette', 'Mood', 'Technique', 'Rarity'],
          description: 'Create rich artistic lore and backstory'
        },
        'character': {
          traits: ['Class', 'Weapon', 'Origin', 'Power Level', 'Alignment', 'Rarity'],
          description: 'Develop character background and abilities'
        },
        'landscape': {
          traits: ['Biome', 'Weather', 'Time of Day', 'Architecture', 'Atmosphere', 'Rarity'],
          description: 'Build environmental worldbuilding'
        },
        'abstract': {
          traits: ['Concept', 'Form', 'Emotion', 'Complexity', 'Symbolism', 'Rarity'],
          description: 'Explore conceptual meaning and interpretation'
        }
      };

      const template = typeTemplates[assetType] || typeTemplates['artwork'];

      const structuredPrompt = `
        You are an expert NFT metadata creator. Generate rich, engaging metadata for a digital asset.

        User's concept: "${prompt}"
        Asset type: "${assetType}"

        Create a JSON object with:
        1. "name": Creative, memorable name (3-8 words max)
        2. "description": Engaging backstory/lore (MAXIMUM 400 characters, be concise but compelling)
        3. "traits": Array of exactly 6 trait objects with "trait_type" and "value"
        4. "rarity_score": Number from 1-100 based on traits combination
        5. "category": Main category classification
        6. "tags": Array of 3-5 relevant tags

        Trait types to use: ${JSON.stringify(template.traits)}
        Focus: ${template.description}

        Make traits interesting and varied. Use creative values, not just common/rare.
        Ensure the description tells a compelling story that enhances the asset's value.

        Return ONLY valid JSON:
      `;

      const result = await this.metadataModel.generateContent(structuredPrompt);
      const response = result.response.text();
      
      // Enhanced JSON parsing with error recovery
      let metadata;
      try {
        const jsonString = this.extractJSON(response);
        metadata = JSON.parse(jsonString);
        
        // Validate and enhance metadata
        metadata = this.validateAndEnhanceMetadata(metadata, prompt);
        
      } catch (parseError) {
        console.warn('JSON parsing failed, using fallback metadata');
        metadata = this.generateFallbackMetadata(prompt, assetType);
      }
      
      console.log('✅ Enhanced AI metadata generated successfully');
      
      this.setCache(cacheKey, metadata);
      return metadata;

    } catch (error) {
      console.error('❌ Error generating enhanced metadata:', error);
      return this.generateFallbackMetadata(prompt, assetType);
    }
  }

  // Enhanced prompt suggestions with categorization
  async suggestPrompts(partialPrompt, category = 'general', count = 5) {
    console.log(`🎨 Generating enhanced AI prompt suggestions for: "${partialPrompt}" in category: ${category}`);

    try {
      const cacheKey = `suggestions_${partialPrompt}_${category}_${count}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const categoryPrompts = {
        'fantasy': 'magical creatures, mythical lands, ancient artifacts, elemental powers',
        'sci-fi': 'futuristic technology, space exploration, cyberpunk cities, AI beings',
        'nature': 'landscapes, wildlife, botanical gardens, natural phenomena',
        'abstract': 'geometric shapes, color theories, emotional concepts, artistic interpretations',
        'character': 'heroes, villains, everyday people, historical figures',
        'architecture': 'buildings, monuments, interior design, urban planning',
        'general': 'diverse creative concepts across all categories'
      };

      const structuredPrompt = `
        You are a creative AI prompt engineer specializing in ${category} themes.
        
        Context: ${categoryPrompts[category] || categoryPrompts['general']}
        User's partial input: "${partialPrompt}"
        
        Generate ${count} diverse, inspiring prompt completions that:
        1. Build naturally from the user's input
        2. Add specific visual details and artistic direction
        3. Include style and mood indicators
        4. Are unique and creative variations
        5. Would generate visually striking results
        
        Each suggestion should be 10-25 words and ready for AI image generation.
        
        Return as a JSON array of strings:
      `;

      const result = await this.textModel.generateContent(structuredPrompt);
      const response = result.response.text();
      
      const jsonString = this.extractJSON(response);
      const suggestions = JSON.parse(jsonString);
      
      // Validate suggestions
      const validSuggestions = suggestions
        .filter(s => typeof s === 'string' && s.length > 10 && s.length < 200)
        .slice(0, count);

      if (validSuggestions.length === 0) {
        throw new Error('No valid suggestions generated');
      }
      
      console.log('✅ Enhanced AI prompt suggestions generated successfully');
      
      this.setCache(cacheKey, validSuggestions);
      return validSuggestions;

    } catch (error) {
      console.error('❌ Error generating enhanced prompt suggestions:', error);
      return this.generateFallbackSuggestions(partialPrompt, count);
    }
  }

  // Utility methods
  extractJSON(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }
    
    throw new Error('No valid JSON found in response');
  }

  validateAndEnhanceMetadata(metadata, originalPrompt) {
    // Ensure required fields
    if (!metadata.name) metadata.name = `AI Asset: ${originalPrompt.slice(0, 30)}`;
    if (!metadata.description) metadata.description = `A unique digital asset created from the prompt: ${originalPrompt}`;
    if (!Array.isArray(metadata.traits)) metadata.traits = [];
    
    // Ensure rarity score
    if (!metadata.rarity_score) {
      metadata.rarity_score = Math.floor(Math.random() * 50) + 25; // 25-75 range
    }
    
    // Add creation metadata
    metadata.creation_method = 'Gemini 2.0 Flash + Enhanced AI Pipeline';
    metadata.generation_timestamp = new Date().toISOString();
    metadata.original_prompt = originalPrompt;
    
    return metadata;
  }

  generateFallbackMetadata(prompt, assetType) {
    return {
      name: `AI ${assetType}: ${prompt.slice(0, 20)}`,
      description: `A unique digital ${assetType} generated from the creative prompt: "${prompt}". This asset represents the intersection of artificial intelligence and human creativity.`,
      traits: [
        { trait_type: 'Type', value: assetType },
        { trait_type: 'Generation', value: 'AI-Created' },
        { trait_type: 'Rarity', value: 'Unique' },
        { trait_type: 'Style', value: 'Digital' }
      ],
      rarity_score: 50,
      category: assetType,
      tags: ['ai-generated', 'digital-art', 'unique'],
      creation_method: 'Enhanced Gemini Service',
      generation_timestamp: new Date().toISOString(),
      original_prompt: prompt
    };
  }

  generateFallbackSuggestions(partialPrompt, count) {
    const fallbacks = [
      `${partialPrompt} in a mystical forest with glowing elements`,
      `${partialPrompt} with cyberpunk neon lighting and futuristic details`,
      `${partialPrompt} in an ethereal dreamscape with surreal colors`,
      `${partialPrompt} as a detailed digital painting with rich textures`,
      `${partialPrompt} in a minimalist style with bold geometric shapes`
    ];
    
    return fallbacks.slice(0, count);
  }

  // Simple caching mechanism
  getFromCache(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheExpiry) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const enhancedGeminiService = new EnhancedGeminiService();

export const generateImage = (prompt, style, quality) => enhancedGeminiService.generateImage(prompt, style, quality);
export const generateMetadata = (prompt, assetType) => enhancedGeminiService.generateMetadata(prompt, assetType);
export const suggestPrompts = (partialPrompt, category, count) => enhancedGeminiService.suggestPrompts(partialPrompt, category, count);

export default enhancedGeminiService;
