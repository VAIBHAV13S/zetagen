import Asset from './models/Asset.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixProblematicUrls = async () => {
  await connectDB();
  
  console.log('Fixing problematic image URLs...');
  
  try {
    // Fix localhost proxy URLs
    const localhostAssets = await Asset.find({
      imageURL: { $regex: 'localhost:5000/api/image/proxy-image' }
    });
    
    console.log(`Found ${localhostAssets.length} assets with localhost proxy URLs`);
    
    for (const asset of localhostAssets) {
      try {
        // Extract the original pollinations.ai URL from the proxy URL
        const matches = asset.imageURL.match(/url=([^&]+)/);
        if (matches) {
          const decodedUrl = decodeURIComponent(matches[1]);
          console.log(`Fixing ${asset.assetId}: ${decodedUrl.substring(0, 80)}...`);
          
          await Asset.updateOne(
            { _id: asset._id },
            { imageURL: decodedUrl }
          );
        }
      } catch (error) {
        console.error(`Error fixing ${asset.assetId}:`, error);
      }
    }
    
    // Fix URLs with %60%60%60 (encoded backticks)
    const malformedAssets = await Asset.find({
      imageURL: { $regex: '%60%60%60' }
    });
    
    console.log(`Found ${malformedAssets.length} assets with malformed URLs`);
    
    for (const asset of malformedAssets) {
      try {
        // Generate a new clean URL using the original prompt
        const cleanPrompt = asset.prompt.replace(/```/g, '').trim();
        const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&model=flux`;
        
        console.log(`Fixing malformed URL for ${asset.assetId}`);
        console.log(`  Old: ${asset.imageURL.substring(0, 80)}...`);
        console.log(`  New: ${newUrl.substring(0, 80)}...`);
        
        await Asset.updateOne(
          { _id: asset._id },
          { imageURL: newUrl }
        );
      } catch (error) {
        console.error(`Error fixing malformed URL for ${asset.assetId}:`, error);
      }
    }
    
    console.log('✅ URL fixing completed!');
    
  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixProblematicUrls();
