const { ethers } = require("hardhat");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("================================================");
  console.log("🧪 INTEGRATION TEST: Backend + Blockchain + IPFS");
  console.log("================================================");

  // 1. SETUP: Get Wallets & Contract Addresses
  const [seller, buyer] = await ethers.getSigners();
  
  // Read the addresses saved by your deploy.js
  const addressPath = path.join(__dirname, "../contract-address.json");
  if (!fs.existsSync(addressPath)) {
    throw new Error("❌ contract-address.json not found! Run deploy.js first.");
  }
  const addresses = require(addressPath);

  // Connect to Contracts
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const AccessPass = await ethers.getContractFactory("AccessPass");
  
  const market = Marketplace.attach(addresses.marketplace);
  const accessPass = AccessPass.attach(addresses.accessPass);

  console.log(`👤 Seller Address: ${seller.address}`);
  console.log(`👤 Buyer Address:  ${buyer.address}`);
  console.log(`📍 Marketplace:    ${addresses.marketplace}`);

  // ---------------------------------------------------------
  // STEP A: CREATE DUMMY FILES & UPLOAD TO BACKEND
  // ---------------------------------------------------------
  console.log("\n[Step A] 📤 Uploading files to Local Backend...");
  
  // Create dummy files for testing
  fs.writeFileSync("test-image.png", "fake image content");
  fs.writeFileSync("test-product.pdf", "SECRET CONTENT: You successfully streamed this!");

  const form = new FormData();
  form.append("preview", fs.createReadStream("test-image.png"));
  form.append("product", fs.createReadStream("test-product.pdf"));

  let previewCid, productCid, contentType;

  try {
    // Call your Node.js Server
    const res = await axios.post("http://localhost:3001/api/upload", form, {
      headers: { ...form.getHeaders() },
    });

    if (!res.data.success) throw new Error("Backend reported failure");
    
    previewCid = res.data.previewCid;
    productCid = res.data.productCid;
    contentType = res.data.contentType; // e.g. "application/pdf"

    console.log("   ✅ Upload Success!");
    console.log("   👉 Preview CID:", previewCid);
    console.log("   👉 Product CID (Secret):", productCid);

  } catch (error) {
    console.error("   ❌ Failed to upload to Backend.");
    console.error("   👉 Is your server running? (node server/index.js)");
    console.error("   👉 Error:", error.message);
    return;
  }

  // ---------------------------------------------------------
  // STEP B: LIST PRODUCT ON BLOCKCHAIN
  // ---------------------------------------------------------
  console.log("\n[Step B] 📝 Listing Product on Blockchain...");
  const price = ethers.parseEther("0.0001"); // Cheap price for testing

  const txList = await market.connect(seller).listProduct(
    price, 
    previewCid, 
    productCid, // This acts as metadataCid in your contract
    "application/pdf"
  );
  
  const receipt = await txList.wait();
  
  // Find the Product ID from the 'ProductListed' event
  const event = receipt.logs
    .map(log => { try { return market.interface.parseLog(log); } catch (e) { return null; } })
    .find(parsed => parsed && parsed.name === 'ProductListed');
    
  const productId = event.args.id;
  console.log(`   ✅ Product Listed! New ID: ${productId}`);

  // ---------------------------------------------------------
  // STEP C: BUY PRODUCT
  // ---------------------------------------------------------
  console.log("\n[Step C] 💰 Buyer purchasing product...");
  
  // Buyer pays ETH to buy
  const txBuy = await market.connect(buyer).buyProduct(productId, { value: price });
  await txBuy.wait();
  console.log("   ✅ Purchase Confirmed on Blockchain!");

  // Verify ownership locally
  const hasAccess = await accessPass.hasAccess(buyer.address, productId);
  console.log(`   🔍 Blockchain Check: Does Buyer own it? ${hasAccess}`);

  if (!hasAccess) {
    console.error("   ❌ Error: Buyer paid but does not have access!");
    return;
  }

  // ---------------------------------------------------------
  // STEP D: VERIFY DELIVERY (STREAMING)
  // ---------------------------------------------------------
  console.log("\n[Step D] 🔓 Attempting to stream content from Backend...");
  
  try {
    const streamRes = await axios.get(`http://localhost:3001/api/consume/${productId}`, {
      headers: { 'x-user-address': buyer.address },
      responseType: 'stream'
    });

    console.log(`   ✅ Server Authorized Request! (Status: ${streamRes.status})`);
    
    // Read the stream to prove we got the data
    streamRes.data.on('data', (chunk) => {
      console.log(`   📄 Received Chunk: "${chunk.toString()}"`);
    });

  } catch (error) {
    console.error("   ❌ Access Denied or Server Error:", error.response ? error.response.data : error.message);
  }
  
  // Cleanup dummy files
  fs.unlinkSync("test-image.png");
  fs.unlinkSync("test-product.pdf");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});