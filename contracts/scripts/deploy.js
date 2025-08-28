const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Starting ZetaGenNFT deployment on ZetaChain...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Deploying contracts with account:', deployer.address);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ZETA');

  // Deploy the contract
  console.log('🔨 Deploying ZetaGenNFT contract...');
  
  const ZetaGenNFT = await ethers.getContractFactory('ZetaGenNFT');
  const contract = await ZetaGenNFT.deploy(
    'Zeta-Gen AI Assets',  // Contract name
    'ZETAGEN',             // Contract symbol
    deployer.address       // Initial owner
  );

  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log('✅ ZetaGenNFT deployed to:', contractAddress);

  // Verify deployment
  console.log('🔍 Verifying deployment...');
  const name = await contract.name();
  const symbol = await contract.symbol();
  const owner = await contract.owner();
  const mintPrice = await contract.mintPrice();
  const maxSupply = await contract.maxSupply();

  console.log('📋 Contract Details:');
  console.log('   Name:', name);
  console.log('   Symbol:', symbol);
  console.log('   Owner:', owner);
  console.log('   Mint Price:', ethers.formatEther(mintPrice), 'ZETA');
  console.log('   Max Supply:', maxSupply.toString());

  // Save deployment info
  const deploymentInfo = {
    network: 'zetachain',
    contractAddress: contractAddress,
    contractName: 'ZetaGenNFT',
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash,
    contractDetails: {
      name: name,
      symbol: symbol,
      owner: owner,
      mintPrice: ethers.formatEther(mintPrice),
      maxSupply: maxSupply.toString()
    }
  };

  console.log('\n📄 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Test basic functionality
  console.log('\n🧪 Testing basic contract functionality...');
  
  try {
    const mintingEnabled = await contract.mintingEnabled();
    console.log('✅ Minting enabled:', mintingEnabled);
    
    const totalSupply = await contract.totalSupply();
    console.log('✅ Current supply:', totalSupply.toString());
    
    console.log('✅ Contract deployment and testing completed successfully!');
  } catch (error) {
    console.error('❌ Error testing contract:', error.message);
  }

  return {
    contract,
    address: contractAddress,
    deploymentInfo
  };
}

// Handle deployment
if (require.main === module) {
  main()
    .then((result) => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('Contract address:', result.address);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = main;
