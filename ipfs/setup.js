// upload.js
require("dotenv").config(); // Load variables from .env file
const { PinataSDK } = require("pinata");
const fs = require("fs");
const { Blob } = require("buffer");

// Check if JWT exists to avoid confusing errors
if (!process.env.PINATA_JWT) {
  console.error("❌ Error: PINATA_JWT not found in .env file");
  process.exit(1);
}

// 1. SETUP: Initialize with variables from .env
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT, 
  pinataGateway: process.env.PINATA_GATEWAY || "example-gateway.mypinata.cloud", 
});

async function uploadFile() {
  try {
    console.log("🚀 Starting upload to IPFS via Pinata...");

    // 2. PREPARE: Read the file
    const buffer = fs.readFileSync("./GIAO TRINH CHXHKH KHONG CHUYEN.pdf");
    const blob = new Blob([buffer]);
    const file = new File([blob], "GIAO TRINH CHXHKH KHONG CHUYEN.pdf", { type: "application/pdf" });

    // 3. UPLOAD: Send to Pinata
    const upload = await pinata.upload.public.file(file);
    
    // 4. RESULT
    console.log("\n✅ Upload Successful!");
    console.log("-----------------------------------");
    console.log(`CID: ${upload.cid}`);
    console.log(`View: https://gateway.pinata.cloud/ipfs/${upload.cid}`);
    console.log("-----------------------------------");

  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}

uploadFile();