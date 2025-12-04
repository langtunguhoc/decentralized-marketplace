// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract AccessPass is ERC721, Ownable{
    uint256 public nextTokenId;
    address public marketplace;

    mapping(uint256=>uint256 ) public tokenToProduct;
    mapping(uint256 => mapping(address=>uint256)) private productOwners;

    event AccessPassMinted( uint256 indexed productId, uint256 indexed tokenId, address indexed buyer);
    event MarketplaceSet( address indexed marketplace);
    modifier onlyMarketplace(){
        require(msg.sender==marketplace);
        _;
    }

    constructor() ERC721("AccessPass","APASS") Ownable(msg.sender) {}

    function setMarketplace (address _marketplace) external onlyOwner(){
        marketplace=_marketplace;
        emit MarketplaceSet(_marketplace);
    }

    function mintAccessPass(address buyer, uint256 productId) external onlyMarketplace() returns (uint256) {
        uint256 tokenId= ++nextTokenId;
        tokenToProduct[tokenId]=productId;
        _safeMint(buyer, tokenId);
        
        emit AccessPassMinted(productId, tokenId, buyer);
        return tokenId;
    }
    
    function hasAccess(address user, uint256 productId) external view returns (bool){
        return productOwners[productId][user] > 0;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        address result = super._update(to, tokenId, auth);

        uint256 productId = tokenToProduct[tokenId];

        if(from != address(0)){
            productOwners[productId][from]--;
        }
        if(to != address(0)){
            productOwners[productId][to]++;
        }
        return result;
    }
}