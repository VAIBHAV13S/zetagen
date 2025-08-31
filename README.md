# ZetaGen - Universal NFT Generator with Gateway API Integration

![ZetaGen Logo](public/logo.svg)

A revolutionary AI-powered NFT generation platform built on ZetaChain's Universal Apps framework, featuring advanced Gateway API integration for seamless cross-chain operations, stZETA payments, ## 📞 Support

- **Discord**: [Join our community](https://discord.gg/zetagen)
- **Documentation**: [Full API docs](https://docs.zetagen.ai)
- **Issues**: [GitHub Issues](https://github.com/your-username/zetagen/issues)niversal asset bridging.

## 🌟 Key Features

### 🚀 Advanced Gateway API Integration
- **Multi-Chain Deployment**: Simultaneous NFT deployment across 5+ blockchains (Ethereum, BSC, Polygon, Avalanche, ZetaChain)
- **stZETA Payments**: Native ZetaChain token integration for gasless transactions
- **Universal Asset Bridging**: Cross-chain asset transfers with automatic fee optimization
- **Real-time Fee Estimation**: Dynamic gas fee calculation across all supported chains

### 🎨 AI-Powered Generation
- **Google Gemini AI**: State-of-the-art image generation with customizable prompts
- **Dynamic Metadata**: Rich NFT metadata with AI-generated descriptions and attributes
- **Batch Processing**: Generate multiple NFTs with consistent themes

### 🔗 Cross-Chain Capabilities
- **Universal App V2**: Built on ZetaChain's latest Universal Apps framework
- **Legacy Integration**: Backward compatibility with existing ZetaGen contracts
- **Multi-Chain Minting**: Deploy NFTs across multiple chains simultaneously

### 💰 Monetization Features
- **Dynamic Pricing**: AI-powered pricing suggestions based on market trends
- **Royalty Management**: Automated royalty distribution across chains
- **Fee Optimization**: Smart routing for minimal cross-chain fees

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Components**: Custom components with Tailwind CSS
- **Wallet Integration**: MetaMask, WalletConnect

### Backend (Node.js + Express)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **AI Service**: Google Gemini AI
- **File Storage**: Local file system with cloud backup

### Smart Contracts (Solidity)
- **Framework**: Hardhat
- **Standard**: ERC-721 with Universal App extensions
- **Cross-Chain**: ZetaChain Universal App V2
- **Libraries**: OpenZeppelin

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- MetaMask wallet
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/zetagen.git
   cd zetagen
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install

   # Backend dependencies
   cd backend
   npm install

   # Smart contracts dependencies
   cd ../contracts
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env

   # Configure your environment variables
   # Add your MongoDB URI, Google Gemini API key, etc.
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   mongod

   # Initialize database (if needed)
   cd backend
   npm run db:init
   ```

5. **Smart Contract Deployment**
   ```bash
   cd contracts
   npx hardhat compile
   npx hardhat run scripts/deployUniversalV2.js --network zetachain-athens
   ```

6. **Start the Application**
   ```bash
   # Start backend server
   cd backend
   npm start

   # Start frontend (in new terminal)
   cd ..
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ZETACHAIN_RPC=https://api.athens2.zetachain.com/evm
VITE_SUPPORTED_CHAINS=1,56,137,43114,7001
```

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zetagen
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
ZETACHAIN_PRIVATE_KEY=your_private_key
```

### Supported Networks
- **Ethereum** (Chain ID: 1)
- **BSC** (Chain ID: 56)
- **Polygon** (Chain ID: 137)
- **Avalanche** (Chain ID: 43114)
- **ZetaChain** (Chain ID: 7001)

## 📚 API Documentation

### Gateway API Endpoints

#### Multi-Chain Deployment
```typescript
POST /api/gateway/deploy
{
  "chains": ["ethereum", "bsc", "polygon"],
  "metadata": {...},
  "paymentToken": "stZETA"
}
```

#### Asset Bridging
```typescript
POST /api/gateway/bridge
{
  "fromChain": "ethereum",
  "toChain": "zetachain",
  "assetId": "asset_123",
  "amount": "1.0"
}
```

#### Fee Estimation
```typescript
GET /api/gateway/fees?chains=ethereum,bsc,polygon
```

### AI Generation Endpoints

#### Generate Image
```typescript
POST /api/generate
{
  "prompt": "A beautiful landscape...",
  "style": "realistic",
  "size": "1024x1024"
}
```

#### Batch Generation
```typescript
POST /api/generate/batch
{
  "prompts": [...],
  "theme": "nature"
}
```

## 🎯 Usage Examples

### Basic NFT Generation
```typescript
import { generateNFT } from './lib/gateway';

const nftData = await generateNFT({
  prompt: "A futuristic cityscape",
  chains: ['ethereum', 'zetachain'],
  paymentMethod: 'stZETA'
});
```

### Cross-Chain Deployment
```typescript
import { deployUniversal } from './lib/gateway';

const deployment = await deployUniversal({
  metadata: nftMetadata,
  targetChains: ['ethereum', 'bsc', 'polygon'],
  useStZeta: true
});
```

### Asset Bridging
```typescript
import { bridgeAsset } from './lib/gateway';

const bridgeTx = await bridgeAsset({
  assetId: 'nft_123',
  fromChain: 'ethereum',
  toChain: 'zetachain',
  recipient: '0x...'
});
```

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
npx hardhat test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker Deployment
```bash
docker build -t zetagen .
docker run -p 8080:8080 zetagen
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ZetaChain** for the Universal Apps framework
- **Google** for Gemini AI integration
- **OpenZeppelin** for secure smart contract libraries
- **MetaMask** for wallet integration

## 📞 Support

- **Discord**: [Join our community](https://discord.gg/zetagen)
- **Documentation**: [Full API docs](https://docs.zetagen.ai)
- **Issues**: [GitHub Issues](https://github.com/your-username/zetagen/issues)

## 🏆 Hackathon Features

This project was built for the ZetaChain hackathon and includes:

- ✅ **Universal App V2 Integration**: Latest ZetaChain framework
- ✅ **Multi-Chain NFT Deployment**: Simultaneous deployment across 5+ chains
- ✅ **stZETA Payment Processing**: Native token integration
- ✅ **Cross-Chain Asset Bridging**: Universal asset transfers
- ✅ **AI-Powered Generation**: Google Gemini integration
- ✅ **Real-time Fee Optimization**: Dynamic gas estimation
- ✅ **Legacy Contract Compatibility**: Backward compatibility

---

**Built with ❤️ for the ZetaChain ecosystem**
