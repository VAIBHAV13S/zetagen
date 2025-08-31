import dotenv from 'dotenv';
dotenv.config();

import('./models/Asset.js').then(async ({default: Asset}) => {
  try {
    const assets = await Asset.find({}).limit(5).sort({createdAt: -1});
    console.log('Recent assets:');
    assets.forEach(asset => {
      console.log(`- Asset ID: ${asset.assetId}`);
      console.log(`  Owner: ${asset.ownerAddress}`);
      console.log(`  Prompt: ${asset.prompt.substring(0, 50)}...`);
      console.log(`  Minted: ${asset.isMinted}`);
      console.log(`  Token ID: ${asset.metadata?.tokenId || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}).catch(console.error);
