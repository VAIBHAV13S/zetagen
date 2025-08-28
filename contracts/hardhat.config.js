require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // ZetaChain Networks
    zeta_testnet: {
      url: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
      chainId: 7001,
      accounts: process.env.ZETACHAIN_PRIVATE_KEY ? [process.env.ZETACHAIN_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    athens: {
      url: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
      chainId: 7001,
      accounts: process.env.ZETACHAIN_PRIVATE_KEY ? [process.env.ZETACHAIN_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    zeta_mainnet: {
      url: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
      chainId: 7000,
      accounts: process.env.ZETACHAIN_PRIVATE_KEY ? [process.env.ZETACHAIN_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    // External Chain Networks for Connectors
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
      chainId: 1,
      accounts: process.env.ETHEREUM_PRIVATE_KEY ? [process.env.ETHEREUM_PRIVATE_KEY] : [],
    },
    ethereum_testnet: {
      url: process.env.ETHEREUM_TESTNET_RPC_URL || 'https://eth-goerli.alchemyapi.io/v2/demo',
      chainId: 5,
      accounts: process.env.ETHEREUM_PRIVATE_KEY ? [process.env.ETHEREUM_PRIVATE_KEY] : [],
    },
    bsc: {
      url: 'https://bsc-dataseed1.binance.org/',
      chainId: 56,
      accounts: process.env.BSC_PRIVATE_KEY ? [process.env.BSC_PRIVATE_KEY] : [],
    },
    bsc_testnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      accounts: process.env.BSC_PRIVATE_KEY ? [process.env.BSC_PRIVATE_KEY] : [],
    },
    polygon: {
      url: 'https://polygon-rpc.com/',
      chainId: 137,
      accounts: process.env.POLYGON_PRIVATE_KEY ? [process.env.POLYGON_PRIVATE_KEY] : [],
    },
    polygon_testnet: {
      url: 'https://rpc-mumbai.maticvigil.com/',
      chainId: 80001,
      accounts: process.env.POLYGON_PRIVATE_KEY ? [process.env.POLYGON_PRIVATE_KEY] : [],
    },
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      chainId: 43114,
      accounts: process.env.AVALANCHE_PRIVATE_KEY ? [process.env.AVALANCHE_PRIVATE_KEY] : [],
    },
    avalanche_testnet: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: process.env.AVALANCHE_PRIVATE_KEY ? [process.env.AVALANCHE_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      // ZetaChain
      zeta_testnet: 'dummy',
      athens: 'dummy',
      zeta_mainnet: 'dummy',
      // External chains
      mainnet: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY,
    },
    customChains: [
      {
        network: 'zeta_testnet',
        chainId: 7001,
        urls: {
          apiURL: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
          browserURL: 'https://explorer.zetachain.com/',
        },
      },
      {
        network: 'athens',
        chainId: 7001,
        urls: {
          apiURL: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
          browserURL: 'https://explorer.zetachain.com/',
        },
      },
      {
        network: 'zeta_mainnet',
        chainId: 7000,
        urls: {
          apiURL: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
          browserURL: 'https://explorer.zetachain.com/',
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
};
