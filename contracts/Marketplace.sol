// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AccessPass.sol";
contract Marketplace is ReentrancyGuard {
    AccessPass public accessPass;
    uint256 public nextProductId;
    
    struct Product{
        address seller;
        uint256 price;
        bool isActive;
        string previewCid;
        string metadataCid;
        string contentType;
        uint256 soldCount;
    }
    mapping( uint256 => Product) public products;

    event ProductListed(uint256 indexed id, address indexed seller);
    event ProductUpdated(uint256 indexed id);
    event ProductSold(uint256 indexed id, address indexed buyer, uint256 tokenId);

    constructor(address _accessPass){
        accessPass = AccessPass(_accessPass);
    }

    function listProduct(
        uint256 price,
        string calldata previewCid,
        string calldata metadataCid,
        string calldata contentType
    ) external returns (uint256)
    {
        require (price > 0," Invalid Price");

        uint256 id = ++nextProductId;

        products[id] = Product(
            msg.sender,
            price,
            true,
            previewCid,
            metadataCid,
            contentType,
            0
        );

        emit ProductListed(id, msg.sender);
        return id;
    }

    function updateListing(
        uint256 id,
        uint256 newPrice,
        string calldata newPreviewCid,
        string calldata newMetadataCid,
        string calldata newContentType,
        bool active
    ) external
    {
        Product storage p = products[id];
        require(msg.sender == p.seller , "Not seller");
        require(p.soldCount == 0, "Cannot update sold product");
        require(newPrice > 0, "Price must be > 0");
        p.price = newPrice;
        p.previewCid = newPreviewCid;
        p.metadataCid = newMetadataCid;
        p.contentType = newContentType;
        p.isActive = active;
        
        emit ProductUpdated(id);
    }

    function buyProduct(uint256 id) external payable nonReentrant returns (uint256) {
        Product storage p = products[id];
        require(p.isActive, "Not Active");
        require(msg.sender != p.seller,"Seller cannot buy");
        require(msg.value == p.price,"Wrong value");
        p.soldCount++;
        uint256 tokenId = accessPass.mintAccessPass(msg.sender, id);
        (bool sent, ) = p.seller.call{value: msg.value}("");
        require(sent, "Payment Failed");
        emit ProductSold(id, msg.sender, tokenId);
        return tokenId;
    }
}