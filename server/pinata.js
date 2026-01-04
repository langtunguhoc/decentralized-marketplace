require("dotenv").config();
const { PinataSDK } = require("pinata");
const { Blob } = require("buffer");

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

// Helper: Upload a file buffer to IPFS
async function uploadToIPFS(fileBuffer, fileName, mimeType) {
  try {
    console.log(`[IPFS] Uploading ${fileName}...`);

    // Create a Blob from the buffer (Required for Pinata SDK)
    const blob = new Blob([fileBuffer]);
    const file = new File([blob], fileName, { type: mimeType });

    // Upload
    const upload = await pinata.upload.public.file(file);
    
    console.log(`[IPFS] Success! CID: ${upload.cid}`);
    return upload.cid;
  } catch (error) {
    console.error("[IPFS] Upload Error:", error);
    throw new Error("Failed to upload to IPFS");
  }
}

module.exports = { uploadToIPFS };