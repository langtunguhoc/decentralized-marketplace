const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // ĐIỀN ĐỊA CHỈ CONTRACT CỦA BẠN VÀO ĐÂY
  const ACCESS_PASS_ADDRESS = "0xcF15fE4C5670608EA821a29734ffb8b490Eee0A5"; // Địa chỉ AccessPass đã deploy
  const MARKETPLACE_ADDRESS = "0xC3a166B1F99aF988679f9AA9fAFCD6f6F8Fe4143"; // Địa chỉ Marketplace đã deploy

  console.log("Đang kết nối vào AccessPass...");
  const accessPass = await hre.ethers.getContractAt("AccessPass", ACCESS_PASS_ADDRESS);

  console.log("Đang set quyền Marketplace...");
  const tx = await accessPass.setMarketplace(MARKETPLACE_ADDRESS);
  await tx.wait();

  console.log("XONG! Marketplace đã được cấp quyền mint NFT.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});