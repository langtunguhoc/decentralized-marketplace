const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const addressesPath = path.join(__dirname, "..", "addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const MARKETPLACE_ADDRESS = addresses.localhost.Marketplace;

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    MARKETPLACE_ADDRESS
  );

  const products = [
    {
      price: "0.1",
      previewCid: "QmPreviewCID_1",
      metadataCid: "QmMetadataCID_1",
      contentType: "video",
    },
    {
      price: "0.2",
      previewCid: "QmPreviewCID_2",
      metadataCid: "QmMetadataCID_2",
      contentType: "image",
    },
    {
      price: "0.3",
      previewCid: "QmPreviewCID_3",
      metadataCid: "QmMetadataCID_3",
      contentType: "pdf",
    },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    const tx = await marketplace.listProduct(
      ethers.parseEther(p.price),
      p.previewCid,
      p.metadataCid,
      p.contentType
    );

    await tx.wait();
    console.log(`Product #${i + 1} created`);
  }

  console.log("✅ All products created successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
