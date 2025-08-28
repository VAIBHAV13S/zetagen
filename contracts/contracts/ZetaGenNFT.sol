// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ZetaGenNFT
 * @dev NFT contract for Zeta-Gen AI-generated digital assets
 * @notice This contract handles minting of AI-generated NFTs on ZetaChain
 */
contract ZetaGenNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    // State variables
    uint256 private _nextTokenId = 1;
    
    // Mapping from asset ID to token ID
    mapping(string => uint256) public assetIdToTokenId;
    
    // Mapping from token ID to asset metadata
    mapping(uint256 => AssetMetadata) public tokenMetadata;
    
    // Mapping to track minted assets
    mapping(string => bool) public mintedAssets;
    
    // Contract configuration
    uint256 public mintPrice = 0.001 ether; // 0.001 ZETA
    uint256 public maxSupply = 10000;
    bool public mintingEnabled = true;
    
    // Events
    event AssetMinted(
        string indexed assetId,
        uint256 indexed tokenId,
        address indexed owner,
        string tokenURI
    );
    
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event MintingToggled(bool enabled);
    
    // Structs
    struct AssetMetadata {
        string assetId;
        string name;
        string description;
        string imageUrl;
        string[] traitTypes;
        string[] traitValues;
        uint256 timestamp;
    }

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        // Token IDs start from 1
    }

    /**
     * @dev Mint a new NFT for an AI-generated asset
     * @param to Address to mint the NFT to
     * @param assetId Unique identifier for the AI asset
     * @param metadataURI Metadata URI for the NFT
     * @param metadata Asset metadata including traits
     */
    function mintAsset(
        address to,
        string memory assetId,
        string memory metadataURI,
        AssetMetadata memory metadata
    ) public payable nonReentrant {
        require(mintingEnabled, "Minting is currently disabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(assetId).length > 0, "Asset ID cannot be empty");
        require(!mintedAssets[assetId], "Asset already minted");
        require(totalSupply() < maxSupply, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");

        uint256 tokenId = _nextTokenId++;

        // Mark asset as minted
        mintedAssets[assetId] = true;
        assetIdToTokenId[assetId] = tokenId;
        tokenMetadata[tokenId] = metadata;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit AssetMinted(assetId, tokenId, to, metadataURI);

        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }

    /**
     * @dev Batch mint multiple assets (owner only)
     * @param recipients Array of addresses to mint to
     * @param assetIds Array of asset IDs
     * @param metadataURIs Array of token URIs
     * @param metadataArray Array of asset metadata
     */
    function batchMintAssets(
        address[] memory recipients,
        string[] memory assetIds,
        string[] memory metadataURIs,
        AssetMetadata[] memory metadataArray
    ) public onlyOwner {
        require(recipients.length == assetIds.length, "Arrays length mismatch");
        require(assetIds.length == metadataURIs.length, "Arrays length mismatch");
        require(metadataURIs.length == metadataArray.length, "Arrays length mismatch");
        require(totalSupply() + recipients.length <= maxSupply, "Would exceed max supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(!mintedAssets[assetIds[i]], "Asset already minted");
            
            uint256 tokenId = _nextTokenId++;

            mintedAssets[assetIds[i]] = true;
            assetIdToTokenId[assetIds[i]] = tokenId;
            tokenMetadata[tokenId] = metadataArray[i];

            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, metadataURIs[i]);

            emit AssetMinted(assetIds[i], tokenId, recipients[i], metadataURIs[i]);
        }
    }

    /**
     * @dev Check if an asset has been minted
     * @param assetId The asset ID to check
     * @return bool Whether the asset has been minted
     */
    function isAssetMinted(string memory assetId) public view returns (bool) {
        return mintedAssets[assetId];
    }

    /**
     * @dev Get token ID for an asset
     * @param assetId The asset ID
     * @return uint256 The token ID (0 if not minted)
     */
    function getTokenIdByAssetId(string memory assetId) public view returns (uint256) {
        return assetIdToTokenId[assetId];
    }

    /**
     * @dev Get asset metadata for a token
     * @param tokenId The token ID
     * @return AssetMetadata The asset metadata
     */
    function getAssetMetadata(uint256 tokenId) public view returns (AssetMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenMetadata[tokenId];
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner The owner address
     * @return uint256[] Array of token IDs
     */
    function getTokensByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
    }

    // Admin functions
    
    /**
     * @dev Set mint price (owner only)
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Toggle minting on/off (owner only)
     * @param enabled Whether minting should be enabled
     */
    function setMintingEnabled(bool enabled) public onlyOwner {
        mintingEnabled = enabled;
        emit MintingToggled(enabled);
    }

    /**
     * @dev Set max supply (owner only)
     * @param newMaxSupply New maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= totalSupply(), "Cannot set below current supply");
        maxSupply = newMaxSupply;
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Emergency withdraw (owner only)
     * @param to Address to send funds to
     */
    function emergencyWithdraw(address payable to) public onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        to.transfer(address(this).balance);
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
