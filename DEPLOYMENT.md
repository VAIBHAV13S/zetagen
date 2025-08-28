# 🚀 ZetaForge Universal App V2 - Deployment Guide

## 📋 **Deployment Overview**

This guide covers deploying ZetaForge Universal App V2 to production using:
- **Frontend**: Vercel (React + TypeScript + Vite)
- **Backend**: Render (Node.js + Express + MongoDB)
- **Smart Contracts**: Already deployed on ZetaChain Athens Testnet

---

## 🎯 **Frontend Deployment on Vercel**

### **Prerequisites:**
- GitHub repository: https://github.com/VAIBHAV13S/zetaforge
- Vercel account: https://vercel.com

### **Deployment Steps:**

1. **Connect Repository to Vercel:**
   ```bash
   # Visit https://vercel.com/new
   # Select "Import Git Repository"
   # Choose: VAIBHAV13S/zetaforge
   ```

2. **Configure Build Settings:**
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://zetaforge-backend.onrender.com
   VITE_APP_NAME=ZetaForge Universal App V2
   VITE_ZETACHAIN_NETWORK=athens_7001
   VITE_UNIVERSAL_CONTRACT_V2=0xd306C9a30359EB053F23C92F754206d2fe0Ed93e
   VITE_UNIVERSAL_CONTRACT_LEGACY=0xDE1bE2A2bc97D2B42cDB61812d90214bB2778326
   VITE_ZETACHAIN_CHAIN_ID=7001
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_PWA=true
   VITE_ENABLE_WEB3=true
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy
   - Domain will be available at: `https://zetaforge-universal-app-v2.vercel.app`

---

## 🖥️ **Backend Deployment on Render**

### **Prerequisites:**
- Render account: https://render.com
- MongoDB Atlas account (for database)

### **Database Setup (MongoDB Atlas):**

1. **Create MongoDB Atlas Cluster:**
   ```bash
   # Visit https://cloud.mongodb.com
   # Create new cluster (Free tier available)
   # Name: zetaforge-production
   # Region: Choose closest to your users
   ```

2. **Get Connection String:**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/zetaforge?retryWrites=true&w=majority
   ```

### **Render Deployment Steps:**

1. **Create Web Service:**
   ```bash
   # Visit https://dashboard.render.com
   # Click "New" → "Web Service"
   # Connect GitHub repository: VAIBHAV13S/zetaforge
   ```

2. **Configure Service:**
   ```
   Name: zetaforge-backend
   Environment: Node
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   GEMINI_API_KEY=<your-gemini-api-key>
   CORS_ORIGIN=https://zetaforge-universal-app-v2.vercel.app
   ZETACHAIN_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
   ZETACHAIN_CHAIN_ID=7001
   UNIVERSAL_CONTRACT_V2=0xd306C9a30359EB053F23C92F754206d2fe0Ed93e
   UNIVERSAL_CONTRACT_LEGACY=0xDE1bE2A2bc97D2B42cDB61812d90214bB2778326
   JWT_SECRET=<generate-secure-random-string>
   RATE_LIMIT_WINDOW=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CACHE_TTL=300000
   MAX_RETRIES=3
   RETRY_DELAY=1000
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Service will be available at: `https://zetaforge-backend.onrender.com`

---

## 🔗 **Post-Deployment Configuration**

### **Update Frontend API URL:**
1. In Vercel dashboard, update environment variable:
   ```
   VITE_API_BASE_URL=https://zetaforge-backend.onrender.com
   ```

2. Redeploy frontend to apply changes.

### **Update Backend CORS:**
1. In Render dashboard, update environment variable:
   ```
   CORS_ORIGIN=https://zetaforge-universal-app-v2.vercel.app
   ```

---

## 🧪 **Testing Deployment**

### **Health Checks:**
```bash
# Backend Health Check
curl https://zetaforge-backend.onrender.com/api/health

# Frontend Access
curl https://zetaforge-universal-app-v2.vercel.app

# API Connectivity Test
curl https://zetaforge-universal-app-v2.vercel.app/api/universal/health
```

### **Functionality Tests:**
1. **AI Image Generation**: Test /api/generate endpoint
2. **NFT Minting**: Test /api/universal/mint endpoint
3. **Cross-Chain**: Verify all supported networks
4. **Performance**: Check response times and caching

---

## 📊 **Monitoring & Analytics**

### **Vercel Analytics:**
```bash
# Enable in Vercel dashboard
# Analytics → Enable Web Analytics
# Add to package.json: "@vercel/analytics"
```

### **Render Monitoring:**
```bash
# Built-in metrics available in dashboard
# Monitor: CPU, Memory, Response times
# Set up alerts for failures
```

### **Custom Monitoring:**
- Backend includes `/api/metrics` endpoint
- Frontend includes performance tracking
- Error tracking with built-in error boundaries

---

## 🔐 **Security Considerations**

### **Environment Variables:**
- ✅ All sensitive data in environment variables
- ✅ Different configs for development/production
- ✅ API keys properly secured

### **CORS Configuration:**
- ✅ Specific origin allowlist
- ✅ Credentials handling
- ✅ Security headers

### **Rate Limiting:**
- ✅ 100 requests per 15 minutes
- ✅ IP-based rate limiting
- ✅ Custom limits for different endpoints

---

## 🚀 **Performance Optimizations**

### **Frontend:**
- ✅ Vite build optimization
- ✅ Code splitting and lazy loading
- ✅ Image optimization
- ✅ CDN delivery via Vercel

### **Backend:**
- ✅ Response caching (5 minutes TTL)
- ✅ Database connection pooling
- ✅ Batch operations support
- ✅ Retry mechanisms

---

## 📈 **Scaling Considerations**

### **Render Scaling:**
```bash
# Upgrade plan for:
# - Higher resource limits
# - Horizontal scaling
# - Custom domains
# - Advanced monitoring
```

### **Database Scaling:**
```bash
# MongoDB Atlas:
# - Cluster tier upgrades
# - Read replicas
# - Sharding for large datasets
```

---

## 🛠️ **Maintenance**

### **Regular Updates:**
- Monitor dependency updates
- Update smart contract addresses
- Refresh API keys periodically
- Monitor performance metrics

### **Backup Strategy:**
- Database: Automated Atlas backups
- Code: GitHub repository
- Configs: Document all environment variables

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**
1. **CORS errors**: Check CORS_ORIGIN configuration
2. **API timeouts**: Verify backend service status
3. **Build failures**: Check environment variables
4. **Database connection**: Verify MongoDB URI

### **Logs:**
- **Vercel**: Functions tab for build/runtime logs
- **Render**: Logs tab for service logs
- **MongoDB**: Atlas monitoring dashboard

---

## 🎯 **Production URLs**

- **Frontend**: https://zetaforge-universal-app-v2.vercel.app
- **Backend**: https://zetaforge-backend.onrender.com
- **GitHub**: https://github.com/VAIBHAV13S/zetaforge
- **Smart Contract V2**: 0xd306C9a30359EB053F23C92F754206d2fe0Ed93e

---

*🚀 Your ZetaForge Universal App V2 is now ready for production deployment!*
