// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  console.log("=====================================");
  console.log("DEPLOY SMART CONTRACT");
  console.log("=====================================");
  console.log("DEPLOY ACCESSPASS");
const [deployer] = await hre.ethers.getSigners();
const nonce = await hre.ethers.provider.getTransactionCount(deployer.address);

console.log("Nonce hiện tại:", nonce);
  const AccessPass = await hre.ethers.getContractFactory("AccessPass");
  const accessPass = await AccessPass.deploy({ gasLimit: 3000000 });
  await accessPass.waitForDeployment();

  const accessPassAddress = await accessPass.getAddress();

  console.log("ACCESSPASS deployed at: ", accessPassAddress,"\n");

  console.log("DEPLOYING MARKETPLACE...");

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(accessPassAddress,{ gasLimit: 3000000 });
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();

  console.log("MARKETPLACE deployed at: ",marketplaceAddress,"\n");
  console.log("Linking marketplace to accessPass");
  const tx = await accessPass.setMarketplace(marketplaceAddress);
  await tx.wait();

  console.log("Marketplace set in accessPass");
  console.log("=====================================");
  console.log(" Deployment Completed Successfully!");
  console.log("=====================================");
  console.log(" AccessPass Address   :", accessPassAddress);
  console.log(" Marketplace Address  :", marketplaceAddress);
  console.log("=====================================\n");
  const fs = require("fs");
  const path = require("path");

  // Tạo đối tượng chứa địa chỉ
  const addresses = {
    accessPass: accessPassAddress,
    marketplace: marketplaceAddress,
  };

  // Lưu vào file JSON ở thư mục gốc (hoặc thư mục frontend nếu muốn)
  const addressFile = path.join(__dirname, "../contract-address.json"); 
  
  fs.writeFileSync(
    addressFile,
    JSON.stringify(addresses, null, 2)
  );
  console.log(`> Addresses saved to: ${addressFile}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
