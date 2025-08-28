const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying ZetaForge Universal App V2...");
    
    const network = hre.network.name;
    console.log(`📡 Network: ${network}`);
    
    // Your existing contract address
    const LEGACY_CONTRACT = "0xDE1bE2A2bc97D2B42cDB61812d90214bB2778326";
    console.log(`🔗 Legacy Contract: ${LEGACY_CONTRACT}`);
    
    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ZETA`);
    
    // Deploy the Universal App V2
    const ZetaForgeUniversalV2 = await hre.ethers.getContractFactory("ZetaForgeUniversalV2");
    
    console.log("📦 Deploying contract...");
    const universalV2 = await ZetaForgeUniversalV2.deploy(
        LEGACY_CONTRACT,
        "ZetaForge AI Universal V2",
        "ZFAU2"
    );
    
    console.log("⏳ Waiting for deployment...");
    await universalV2.waitForDeployment();
    
    console.log("✅ ZetaForge Universal App V2 deployed successfully!");
    console.log(`📋 Contract Address: ${await universalV2.getAddress()}`);
    console.log(`🔗 Network: ${network}`);
    console.log(`🔗 Legacy Contract: ${LEGACY_CONTRACT}`);
    console.log(`💰 Mint Price: 0.01 ZETA`);
    console.log(`🌍 Max Supply: 50,000 NFTs`);
    console.log(`🆔 Token ID Range: 10,001 - 60,000`);
    
    // Test basic functionality
    console.log("\n🧪 Testing Universal App V2 functionality...");
    
    // Check initial state
    const totalSupply = await universalV2.totalSupply();
    const mintPrice = await universalV2.mintPrice();
    const universalModeEnabled = await universalV2.universalModeEnabled();
    const legacyMigrationEnabled = await universalV2.legacyMigrationEnabled();
    
    console.log(`📊 Initial Total Supply: ${totalSupply}`);
    console.log(`💰 Mint Price: ${hre.ethers.formatEther(mintPrice)} ZETA`);
    console.log(`🌍 Universal Mode: ${universalModeEnabled}`);
    console.log(`🔄 Legacy Migration: ${legacyMigrationEnabled}`);
    
    // Test cross-chain fees
    const ethFee = await universalV2.getChainFee(1);
    const bscFee = await universalV2.getChainFee(56);
    const polygonFee = await universalV2.getChainFee(137);
    const zetaFee = await universalV2.getChainFee(7001);
    
    console.log("\n🌐 Cross-chain Fees:");
    console.log(`  Ethereum: ${hre.ethers.formatEther(ethFee)} ZETA`);
    console.log(`  BSC: ${hre.ethers.formatEther(bscFee)} ZETA`);
    console.log(`  Polygon: ${hre.ethers.formatEther(polygonFee)} ZETA`);
    console.log(`  ZetaChain: ${hre.ethers.formatEther(zetaFee)} ZETA`);
    
    // Check legacy contract integration
    try {
        const legacyTotalSupply = await universalV2.totalCombinedSupply();
        console.log(`📊 Combined Supply (Legacy + V2): ${legacyTotalSupply}`);
    } catch (error) {
        console.log("⚠️ Legacy contract integration test failed:", error.message);
    }
    
    // Save deployment info
    const contractAddress = await universalV2.getAddress();
    const deploymentInfo = {
        network: network,
        contractAddress: contractAddress,
        legacyContract: LEGACY_CONTRACT,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        mintPrice: hre.ethers.formatEther(mintPrice),
        totalSupply: totalSupply.toString(),
        maxSupply: "50000",
        tokenIdStart: "10001",
        universalModeEnabled: universalModeEnabled,
        legacyMigrationEnabled: legacyMigrationEnabled,
        transactionHash: universalV2.deploymentTransaction().hash,
        features: [
            "Cross-chain minting",
            "Legacy contract integration", 
            "Asset migration",
            "Enhanced metadata",
            "Batch operations",
            "Fee management"
        ]
    };
    
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, `universal-v2-${network}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`\n💾 Deployment info saved to deployments/universal-v2-${network}.json`);
    
    // Update .env file suggestion
    console.log("\n📝 Update your backend .env file:");
    console.log(`ZETAFORGE_UNIVERSAL_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`ZETAFORGE_LEGACY_CONTRACT_ADDRESS=${LEGACY_CONTRACT}`);
    
    console.log("\n🎉 Universal App V2 deployment completed successfully!");
    console.log("\n📋 Features Available:");
    console.log("✅ Cross-chain minting from Ethereum, BSC, Polygon, Avalanche");
    console.log("✅ Legacy contract integration and asset migration");
    console.log("✅ Enhanced metadata storage with source chain tracking");
    console.log("✅ Backward compatibility with existing APIs");
    console.log("✅ Dynamic fee management for different chains");
    console.log("✅ Batch operations for gas efficiency");
    
    console.log("\n📝 Next Steps:");
    console.log("1. Update backend to use Universal V2 contract");
    console.log("2. Deploy connector contracts on external chains");
    console.log("3. Test cross-chain minting functionality");
    console.log("4. Enable legacy asset migration for users");
    console.log("5. Update frontend with Universal App features");
    
    return {
        contractAddress: contractAddress,
        legacyContract: LEGACY_CONTRACT,
        deploymentInfo
    };
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Universal V2 deployment failed:", error);
        process.exit(1);
    });

module.exports = main;
