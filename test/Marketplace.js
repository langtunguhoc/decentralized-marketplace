const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace + AccessPass", function () {
  let AccessPass, accessPass, Marketplace, market;
  let owner, seller, buyer, stranger;

  beforeEach(async function () {
    [owner, seller, buyer, stranger] = await ethers.getSigners();

    AccessPass = await ethers.getContractFactory("AccessPass");
    accessPass = await AccessPass.deploy();
    await accessPass.waitForDeployment(); // Hardhat v6+ dùng waitForDeployment

    Marketplace = await ethers.getContractFactory("Marketplace");
    market = await Marketplace.deploy(accessPass.target);
    await market.waitForDeployment();

    await accessPass.setMarketplace(market.target);
  });

  // 1. Đăng sản phẩm
  it("1. Should list a product", async function () {
    await market.connect(seller).listProduct(
      ethers.parseEther("1"),
      "cid1",
      "cidMeta",
      "image/png"
    );

    const p = await market.products(1);
    expect(p.seller).to.equal(seller.address);
    expect(p.price).to.equal(ethers.parseEther("1"));
    expect(p.isActive).to.equal(true);
  });

  // 2. Không cho price = 0
  it("2. Should NOT allow zero price", async function () {
    // SỬA: Chuỗi lỗi phải khớp với " Invalid Price" trong contract
    // Lưu ý: Contract của bạn có dấu cách ở đầu " Invalid Price"
    await expect(
      market.connect(seller).listProduct(0, "a", "b", "c")
    ).to.be.revertedWith(" Invalid Price"); 
  });

  // 3. Mua và Mint NFT
  it("3. Buyer can purchase product and get NFT", async function () {
    const price = ethers.parseEther("0.01");
    await market.connect(seller).listProduct(price, "cid", "meta", "image/png");
    
    await market.connect(buyer).buyProduct(1, { value: price });

    // Kiểm tra owner của NFT id 1
    expect(await accessPass.ownerOf(1)).to.equal(buyer.address);
    
    const p = await market.products(1);
    expect(p.soldCount).to.equal(1);
  });

  // 4. Sai tiền
  it("4. Should revert if value sent is wrong", async function () {
    const price = ethers.parseEther("0.01");
    await market.connect(seller).listProduct(price, "cid", "m", "img");
    
    // SỬA: Contract báo lỗi là "Wrong value"
    await expect(
      market.connect(buyer).buyProduct(1, { value: ethers.parseEther("0.005") })
    ).to.be.revertedWith("Wrong value");
  });

  // 5. Seller tự mua
  it("5. Seller cannot buy their own product", async function () {
    const price = ethers.parseEther("0.01");
    await market.connect(seller).listProduct(price, "x", "y", "img");

    await expect(
      market.connect(seller).buyProduct(1, { value: price })
    ).to.be.revertedWith("Seller cannot buy");
  });

  // 6. Mua sản phẩm inactive
  it("6. Should not allow buying inactive product", async function () {
    const price = ethers.parseEther("0.01");
    await market.connect(seller).listProduct(price, "x", "y", "img");

    // SỬA: Contract không có setActive, phải dùng updateListing
    // updateListing(id, price, preview, meta, type, isActive)
    await market.connect(seller).updateListing(
        1, 
        price, 
        "x", 
        "y", 
        "img", 
        false // Set active = false
    );

    // SỬA: Contract báo lỗi là "Not Active"
    await expect(
      market.connect(buyer).buyProduct(1, { value: price })
    ).to.be.revertedWith("Not Active");
  });

  // -------------------------------------------------------------------------
  // 7. Buyer chưa mua => KHÔNG CÓ quyền truy cập
  // -------------------------------------------------------------------------
  it("7. Buyer should NOT have access before buying", async function () {
    const price = ethers.parseEther("0.5");
    
    // Seller đăng bán
    await market.connect(seller).listProduct(price, "cid", "meta", "file/pdf");

    // Kiểm tra ngay: Buyer chưa mua gì cả
    // Hàm hasAccess(user, productId) trả về bool
    expect(await accessPass.hasAccess(buyer.address, 1)).to.equal(false);
  });

  // -------------------------------------------------------------------------
  // 8. Buyer đã mua => CÓ quyền truy cập
  // -------------------------------------------------------------------------
  it("8. Buyer should have access after buying NFT", async function () {
    const price = ethers.parseEther("0.01");

    // Seller đăng bán
    await market.connect(seller).listProduct(price, "x", "y", "img");
    
    // Buyer mua hàng
    await market.connect(buyer).buyProduct(1, { value: price });

    // Kiểm tra: Buyer phải có quyền truy cập vào Product ID 1
    expect(await accessPass.hasAccess(buyer.address, 1)).to.equal(true);
    
    // Kiểm tra thêm: Balance NFT phải là 1
    expect(await accessPass.balanceOf(buyer.address)).to.equal(1);
  });

  // 9. Check quyền update
  it("9. Only seller can update product", async function () {
    await market.connect(seller).listProduct(ethers.parseEther("1"),"c","m","p");

    // SỬA: Dùng updateListing thay vì setPrice
    await expect(
      market.connect(stranger).updateListing(
          1, 
          ethers.parseEther("2"), 
          "c", "m", "p", true
      )
    ).to.be.revertedWith("Not seller");
  });

  // 10. Check tiền về ví (Sửa lại cho logic Push Payment)
  it("10. Seller receives funds immediately", async function () {
    const price = ethers.parseEther("1");
    await market.connect(seller).listProduct(price, "x", "y", "img");

    // Lấy số dư trước khi bán
    const balanceBefore = await ethers.provider.getBalance(seller.address);

    // Buyer mua
    await market.connect(buyer).buyProduct(1, { value: price });

    // Lấy số dư sau khi bán
    const balanceAfter = await ethers.provider.getBalance(seller.address);

    // Kiểm tra tiền đã tăng lên (Seller nhận được tiền ngay lập tức)
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });
});