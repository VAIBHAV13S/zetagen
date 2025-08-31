// Script to check if getChainFee exists on deployed contract
import { ethers } from "ethers";

const RPC_URL = "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"; // Replace with your ZetaChain Athens RPC URL
const CONTRACT_ADDRESS = "0xd306C9a30359EB053F23C92F754206d2fe0Ed93e";

async function main() {
    // Load ABI using fs/promises and path
    let universalABI;
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const abiPath = path.join(__dirname, '../abi/ZetaForgeUniversalV2.json');
        const abiData = await fs.readFile(abiPath, 'utf8');
        const abiJson = JSON.parse(abiData);
        if (abiJson.abi && Array.isArray(abiJson.abi)) {
            universalABI = abiJson.abi;
        } else if (Array.isArray(abiJson)) {
            universalABI = abiJson;
        } else {
            throw new Error('ABI format not recognized');
        }
    } catch (error) {
        console.error('❌ Failed to load Universal ABI:', error);
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, universalABI, provider);
    try {
        // Try calling getChainFee for chainId 1 (Ethereum)
        const fee = await contract.getChainFee(1);
        console.log("getChainFee(1) exists. Fee:", fee.toString());
    } catch (err) {
        console.error("getChainFee does NOT exist or call failed:", err.message);
    }
}

main();
