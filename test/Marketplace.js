const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  let AccessPass, accessPass, Marketplace, market;
  let owner, seller, buyer;

  beforeEach(async function () {
    // Lấy danh sách ví
    [owner, seller, buyer] = await ethers.getSigners();

    // Deploy AccessPass
    AccessPass = await ethers.getContractFactory("AccessPass");
    accessPass = await AccessPass.deploy();
    await accessPass.waitForDeployment(); // Ethers v6 dùng hàm này

    // Deploy Marketplace
    Marketplace = await ethers.getContractFactory("Marketplace");
    
    // Ethers v6 dùng .target thay cho .address
    market = await Marketplace.deploy(accessPass.target); 
    await market.waitForDeployment();

    // Set quyền cho Marketplace bên AccessPass
    await accessPass.setMarketplace(market.target); 
  });

  it("Should list product", async function () {
    const tx = await market.connect(seller).listProduct(
      ethers.parseEther("1"), // Đổi 1 ETH ra số wei
      "previewCid",
      "metadataCid",
      "image/png" 
    );
    await tx.wait();

    const p = await market.products(1);
    
    // So sánh BigInt
    expect(p.price).to.equal(ethers.parseEther("1"));
    expect(p.seller).to.equal(seller.address);
  });

  it("Should buy product and mint NFT", async function () {
    const price = ethers.parseEther("0.01"); 

    // Seller đăng bán
    await market.connect(seller).listProduct(
      price,
      "abc",
      "xyz",
      "image/png"
    );

    // Buyer mua (gửi kèm tiền value)
    await market.connect(buyer).buyProduct(1, { value: price });

    // Kiểm tra quyền sở hữu NFT
    expect(await accessPass.ownerOf(1)).to.equal(buyer.address);
    
    // Kiểm tra số lượng đã bán
    const p = await market.products(1);
    expect(p.soldCount).to.equal(1);
  });
});