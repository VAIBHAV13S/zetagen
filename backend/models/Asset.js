import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  prompt: {
    type: String,
    required: true,
    maxlength: 1000
  },
  metadata: {
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    traits: [{
      trait_type: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    transactionHash: {
      type: String,
      default: null
    },
    tokenId: {
      type: String,
      default: null
    }
  },
  imageURL: {
    type: String,
    required: true
  },
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  mintTxHash: {
    type: String,
    default: null
  },
  isMinted: {
    type: Boolean,
    default: false
  },
  generationParameters: {
    style: String,
    quality: String,
    size: String,
    model: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
assetSchema.index({ ownerAddress: 1, createdAt: -1 });
assetSchema.index({ isMinted: 1 });
assetSchema.index({ 'metadata.createdAt': -1 });

// Virtual for formatted creation date
assetSchema.virtual('formattedCreatedAt').get(function() {
  return this.metadata.createdAt.toISOString();
});

// Static method to find assets by owner
assetSchema.statics.findByOwner = function(ownerAddress) {
  return this.find({ ownerAddress: ownerAddress.toLowerCase() })
             .sort({ createdAt: -1 });
};

// Static method to find minted assets
assetSchema.statics.findMinted = function() {
  return this.find({ isMinted: true })
             .sort({ createdAt: -1 });
};

// Instance method to mark as minted
assetSchema.methods.markAsMinted = function(txHash, tokenId) {
  this.isMinted = true;
  this.mintTxHash = txHash;
  this.metadata.transactionHash = txHash;
  this.metadata.tokenId = tokenId;
  return this.save();
};

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
