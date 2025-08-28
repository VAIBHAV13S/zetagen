// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IZRC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function withdraw(bytes memory to, uint256 amount) external returns (bool);
}

interface ISystemContract {
    function gasCoinZRC20ByChainId(uint256 chainID) external view returns (address);
    function gasPriceByChainId(uint256 chainID) external view returns (uint256);
}

// Legacy contract interface
interface IZetaGenNFT {
    function totalSupply() external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function getAssetMetadata(uint256 tokenId) external view returns (
        string memory assetId,
        string memory name,
        string memory description,
        string memory imageUrl,
        string[] memory traitTypes,
        string[] memory traitValues,
        uint256 timestamp
    );
}

/**
 * @title ZetaForge Universal App V2
 * @dev Universal App for cross-chain AI-generated NFT minting on ZetaChain
 * @notice This contract enables users to mint NFTs from any connected blockchain
 */
contract ZetaForgeUniversalV2 is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    
    // Legacy contract reference
    IZetaGenNFT public legacyContract;
    
    // Universal App state
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 50000; // Increased for Universal App
    uint256 public mintPrice = 0.01 ether; // Base price in ZETA
    
    // Cross-chain tracking
    mapping(uint256 => address) public chainMinters; // tokenId => original minter
    mapping(uint256 => uint256) public mintChains;   // tokenId => source chain ID
    mapping(address => uint256[]) public userAssets; // user => token IDs
    
    // AI metadata storage (enhanced)
    mapping(uint256 => string) public tokenPrompts;
    mapping(uint256 => string) public tokenTraits;
    mapping(uint256 => uint256) public creationTimestamp;
    mapping(string => uint256) public assetIdToTokenId;
    mapping(string => bool) public mintedAssets;
    
    // Cross-chain fee structure
    mapping(uint256 => uint256) public chainFees; // chainId => fee in ZETA
    
    // Universal App configuration
    bool public universalModeEnabled = true;
    bool public legacyMigrationEnabled = true;
    
    // Events
    event AssetMinted(
        uint256 indexed tokenId,
        address indexed minter,
        uint256 indexed sourceChain,
        string assetId,
        string prompt,
        string metadataURI
    );
    
    event CrossChainMintRequested(
        address indexed user,
        uint256 indexed sourceChain,
        string assetId,
        string prompt
    );
    
    event LegacyAssetMigrated(
        uint256 indexed legacyTokenId,
        uint256 indexed newTokenId,
        address indexed owner
    );
    
    event ChainFeeUpdated(uint256 indexed chainId, uint256 newFee);
    event MintPriceUpdated(uint256 newPrice);
    
    // Structs
    struct AssetMetadata {
        string assetId;
        string name;
        string description;
        string imageUrl;
        string[] traitTypes;
        string[] traitValues;
        uint256 timestamp;
        uint256 sourceChain;
        address originalMinter;
    }
    
    mapping(uint256 => AssetMetadata) public tokenMetadata;
    
    modifier validChain(uint256 chainId) {
        require(chainId > 0, "Invalid chain ID");
        _;
    }
    
    modifier onlyUniversalMode() {
        require(universalModeEnabled, "Universal mode disabled");
        _;
    }

    constructor(
        address _legacyContract,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        legacyContract = IZetaGenNFT(_legacyContract);
        
        // Start token IDs from 10001 to avoid conflicts with legacy
        _nextTokenId = 10001;
        
        // Initialize cross-chain fees (in ZETA wei)
        chainFees[1] = 0.005 ether;     // Ethereum
        chainFees[56] = 0.002 ether;    // BSC
        chainFees[137] = 0.002 ether;   // Polygon
        chainFees[43114] = 0.003 ether; // Avalanche
        chainFees[7001] = 0.001 ether;  // ZetaChain Testnet
        chainFees[7000] = 0.001 ether;  // ZetaChain Mainnet
    }

    /**
     * @dev Cross-chain mint function (can be called by system contract or direct)
     * @param to Address to mint to
     * @param sourceChain Chain ID where the request originated
     * @param assetId Unique asset identifier
     * @param prompt AI generation prompt
     * @param metadataURI IPFS URI for metadata
     * @param traits JSON string of NFT traits
     */
    function crossChainMint(
        address to,
        uint256 sourceChain,
        string memory assetId,
        string memory prompt,
        string memory metadataURI,
        string memory traits
    ) external payable onlyUniversalMode nonReentrant {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        require(bytes(assetId).length > 0, "Asset ID required");
        require(!mintedAssets[assetId], "Asset already minted");
        
        // Check payment for cross-chain or direct mint
        uint256 requiredFee = sourceChain == block.chainid ? mintPrice : chainFees[sourceChain];
        require(msg.value >= requiredFee, "Insufficient fee");
        
        // Mint the NFT
        uint256 tokenId = _mintAsset(to, sourceChain, assetId, prompt, metadataURI, traits);
        
        // Refund excess payment
        if (msg.value > requiredFee) {
            payable(msg.sender).transfer(msg.value - requiredFee);
        }
        
        emit CrossChainMintRequested(to, sourceChain, assetId, prompt);
    }

    /**
     * @dev Direct mint function for ZetaChain native users (backward compatibility)
     */
    function mintAsset(
        address to,
        string memory assetId,
        string memory metadataURI,
        AssetMetadata memory metadata
    ) external payable nonReentrant {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(assetId).length > 0, "Asset ID required");
        require(!mintedAssets[assetId], "Asset already minted");
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        
        // Mark asset as minted
        mintedAssets[assetId] = true;
        assetIdToTokenId[assetId] = tokenId;
        tokenMetadata[tokenId] = metadata;
        tokenMetadata[tokenId].sourceChain = block.chainid;
        tokenMetadata[tokenId].originalMinter = to;
        
        // Track for user
        chainMinters[tokenId] = to;
        mintChains[tokenId] = block.chainid;
        userAssets[to].push(tokenId);
        creationTimestamp[tokenId] = block.timestamp;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit AssetMinted(tokenId, to, block.chainid, assetId, "", metadataURI);
        
        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }

    /**
     * @dev Internal function to mint an asset
     */
    function _mintAsset(
        address to,
        uint256 sourceChain,
        string memory assetId,
        string memory prompt,
        string memory metadataURI,
        string memory traits
    ) internal returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        // Mark asset as minted
        mintedAssets[assetId] = true;
        assetIdToTokenId[assetId] = tokenId;
        
        // Store metadata
        tokenPrompts[tokenId] = prompt;
        tokenTraits[tokenId] = traits;
        creationTimestamp[tokenId] = block.timestamp;
        chainMinters[tokenId] = to;
        mintChains[tokenId] = sourceChain;
        userAssets[to].push(tokenId);
        
        // Create metadata struct
        string[] memory emptyTraitTypes;
        string[] memory emptyTraitValues;
        
        tokenMetadata[tokenId] = AssetMetadata({
            assetId: assetId,
            name: string(abi.encodePacked("ZetaForge AI #", _toString(tokenId))),
            description: prompt,
            imageUrl: metadataURI,
            traitTypes: emptyTraitTypes,
            traitValues: emptyTraitValues,
            timestamp: block.timestamp,
            sourceChain: sourceChain,
            originalMinter: to
        });
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit AssetMinted(tokenId, to, sourceChain, assetId, prompt, metadataURI);
        
        return tokenId;
    }

    /**
     * @dev Migrate asset from legacy contract
     */
    function migrateLegacyAsset(uint256 legacyTokenId) external nonReentrant {
        require(legacyMigrationEnabled, "Migration disabled");
        require(legacyContract.ownerOf(legacyTokenId) == msg.sender, "Not owner of legacy token");
        
        // Get legacy metadata
        (
            string memory assetId,
            string memory name,
            string memory description,
            string memory imageUrl,
            string[] memory traitTypes,
            string[] memory traitValues,
            uint256 timestamp
        ) = legacyContract.getAssetMetadata(legacyTokenId);
        
        // Check if already migrated
        require(!mintedAssets[assetId], "Asset already migrated");
        
        uint256 newTokenId = _nextTokenId++;
        
        // Mark as minted
        mintedAssets[assetId] = true;
        assetIdToTokenId[assetId] = newTokenId;
        
        // Store enhanced metadata
        tokenMetadata[newTokenId] = AssetMetadata({
            assetId: assetId,
            name: name,
            description: description,
            imageUrl: imageUrl,
            traitTypes: traitTypes,
            traitValues: traitValues,
            timestamp: timestamp,
            sourceChain: 7001, // Legacy from ZetaChain testnet
            originalMinter: msg.sender
        });
        
        // Track for user
        chainMinters[newTokenId] = msg.sender;
        mintChains[newTokenId] = 7001;
        userAssets[msg.sender].push(newTokenId);
        creationTimestamp[newTokenId] = timestamp;
        
        string memory legacyURI = legacyContract.tokenURI(legacyTokenId);
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, legacyURI);
        
        emit LegacyAssetMigrated(legacyTokenId, newTokenId, msg.sender);
        emit AssetMinted(newTokenId, msg.sender, 7001, assetId, "", legacyURI);
    }

    /**
     * @dev Batch mint function for efficiency
     */
    function batchMintAssets(
        address[] memory recipients,
        string[] memory assetIds,
        string[] memory prompts,
        string[] memory metadataURIs,
        string[] memory traits
    ) external payable onlyOwner {
        require(recipients.length == assetIds.length, "Array length mismatch");
        require(assetIds.length == prompts.length, "Array length mismatch");
        require(prompts.length == metadataURIs.length, "Array length mismatch");
        require(metadataURIs.length == traits.length, "Array length mismatch");
        require(_nextTokenId + recipients.length <= MAX_SUPPLY, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mintAsset(recipients[i], block.chainid, assetIds[i], prompts[i], metadataURIs[i], traits[i]);
        }
    }

    /**
     * @dev Get user's assets with metadata from both contracts
     */
    function getUserAssets(address user) external view returns (
        uint256[] memory tokenIds,
        string[] memory assetIds,
        string[] memory prompts,
        string[] memory uris,
        uint256[] memory timestamps,
        uint256[] memory sourceChains
    ) {
        uint256[] memory userTokens = userAssets[user];
        uint256 length = userTokens.length;
        
        tokenIds = new uint256[](length);
        assetIds = new string[](length);
        prompts = new string[](length);
        uris = new string[](length);
        timestamps = new uint256[](length);
        sourceChains = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = userTokens[i];
            tokenIds[i] = tokenId;
            assetIds[i] = tokenMetadata[tokenId].assetId;
            prompts[i] = tokenPrompts[tokenId];
            uris[i] = tokenURI(tokenId);
            timestamps[i] = creationTimestamp[tokenId];
            sourceChains[i] = mintChains[tokenId];
        }
    }

    /**
     * @dev Get combined total supply (legacy + universal)
     */
    function totalCombinedSupply() external view returns (uint256) {
        return totalSupply() + legacyContract.totalSupply();
    }

    // Admin functions
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        mintPrice = _newPrice;
        emit MintPriceUpdated(_newPrice);
    }

    function setChainFee(uint256 chainId, uint256 fee) external onlyOwner validChain(chainId) {
        chainFees[chainId] = fee;
        emit ChainFeeUpdated(chainId, fee);
    }

    function setUniversalMode(bool enabled) external onlyOwner {
        universalModeEnabled = enabled;
    }

    function setLegacyMigration(bool enabled) external onlyOwner {
        legacyMigrationEnabled = enabled;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // View functions
    function getChainFee(uint256 chainId) external view returns (uint256) {
        return chainFees[chainId];
    }

    function isAssetMinted(string memory assetId) external view returns (bool) {
        return mintedAssets[assetId];
    }

    function getTokenIdByAssetId(string memory assetId) external view returns (uint256) {
        return assetIdToTokenId[assetId];
    }

    function getAssetMetadata(uint256 tokenId) external view returns (AssetMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenMetadata[tokenId];
    }

    // Utility function
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Override required functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
