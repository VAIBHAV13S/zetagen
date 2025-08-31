import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from backend/.env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Asset model
const AssetModelPath = path.join(__dirname, '../models/Asset.js');
const { default: Asset } = await import(`file://${AssetModelPath}`);

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';

async function run() {
  const assetId = process.argv[2];
  if (!assetId) {
    console.error('Usage: node resetMintStatus.mjs <assetId>');
    process.exit(2);
  }

  console.log('Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { dbName: undefined });

  try {
    const asset = await Asset.findOne({ assetId });
    if (!asset) {
      console.error('Asset not found:', assetId);
      process.exit(1);
    }

    asset.isMinted = false;
    asset.mintTxHash = null;
    if (asset.metadata) {
      asset.metadata.transactionHash = null;
      asset.metadata.tokenId = null;
    }

    await asset.save();
    console.log('Reset mint status for asset:', assetId);
    console.log('isMinted:', asset.isMinted);
    console.log('mintTxHash:', asset.mintTxHash);
    console.log('metadata.tokenId:', asset.metadata?.tokenId);
  } catch (err) {
    console.error('Error resetting asset:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
