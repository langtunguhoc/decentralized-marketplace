const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { ethers } = require('ethers');
const axios = require('axios');
const path = require('path');
const { uploadToIPFS } = require('./pinata');
require('dotenv').config();

// 1. SETUP CONFIGURATION
const app = express();
app.use(cors()); // Allow frontend access
app.use(express.json());

// Load Contract Addresses and ABIs
// NOTE: Adjust paths if your folder structure is different
const addresses = require('../contract-address.json');
const AccessPassArtifact = require('../artifacts/contracts/AccessPass.sol/AccessPass.json');
const MarketplaceArtifact = require('../artifacts/contracts/Marketplace.sol/Marketplace.json');

// Connect to Blockchain (Read-Only Provider)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const accessPass = new ethers.Contract(addresses.accessPass, AccessPassArtifact.abi, provider);
const marketplace = new ethers.Contract(addresses.marketplace, MarketplaceArtifact.abi, provider);

// Setup Multer for file uploads (Stored in RAM temporarily)
const upload = multer({ storage: multer.memoryStorage() });

// ==================================================================
// ROUTE A: UPLOAD PRODUCT (For Sellers)
// Receives 2 files: 'preview' (image) and 'product' (digital content)
// ==================================================================
const uploadFields = upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'product', maxCount: 1 }
]);

app.post('/api/upload', uploadFields, async (req, res) => {
    try {
        const files = req.files;
        
        if (!files || !files.preview || !files.product) {
            return res.status(400).json({ error: "Both 'preview' and 'product' files are required." });
        }

        const previewFile = files.preview[0];
        const productFile = files.product[0];

        // 1. Upload Preview (Public Image)
        const previewCid = await uploadToIPFS(
            previewFile.buffer, 
            previewFile.originalname, 
            previewFile.mimetype
        );

        // 2. Upload Product (Hidden Content)
        // In a real app, you might encrypt 'productFile.buffer' here before uploading
        const productCid = await uploadToIPFS(
            productFile.buffer, 
            productFile.originalname, 
            productFile.mimetype
        );

        // 3. Return CIDs to Frontend
        // Frontend will then call the Smart Contract to list the product
        res.json({
            success: true,
            previewCid: previewCid,
            productCid: productCid,
            contentType: productFile.mimetype
        });

    } catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ error: "Server upload failed" });
    }
});

// ==================================================================
// ROUTE B: SECURE STREAM (For Buyers)
// Verifies ownership on-chain, then streams the file from IPFS
// ==================================================================
app.get('/api/consume/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        // 1. Get User Address from Headers (Sent by Frontend)
        const userAddress = req.headers['x-user-address'];
        console.log(`\n[DEBUG] 1. Request received for Product #${productId}`);
        console.log(`[DEBUG] 2. User asking: ${userAddress}`);
        if (!userAddress) return res.status(400).send("Missing user address");

        // 2. VERIFY ACCESS (Call Smart Contract)
        // "Does this user own the Access Pass for this Product ID?"
        const hasAccess = await accessPass.hasAccess(userAddress, productId);
        console.log(`[DEBUG] 3. Blockchain says Access is: ${hasAccess}`);

        if (!hasAccess) {
            console.log(`Access Denied: ${userAddress} for Product ${productId}`);
            return res.status(403).send("Access Denied: You have not purchased this product.");
        }

        // 3. FETCH DATA (Get IPFS CID from Smart Contract)
        // "What is the secret file for Product ID?"
        const productData = await marketplace.products(productId);
        console.log(`[DEBUG] 4. Found CID: ${productData.metadataCid}`);
        console.log(`[DEBUG] 5. Content-Type: ${productData.contentType}`);
        const secretCid = productData.metadataCid; // This is stored on-chain
        const contentType = productData.contentType;

        if (!secretCid) return res.status(404).send("Product file not found.");

        // 4. STREAM FILE (From Pinata to User)
        // We fetch from IPFS Gateway using our API Key (so it's fast)
        const ipfsUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${secretCid}?pinataGatewayToken=${process.env.PINATA_JWT}`;
        
        // Use axios to get the file stream
        const response = await axios({
            method: 'get',
            url: ipfsUrl,
            responseType: 'stream'
        });

        // Pipe the stream directly to the user (Browser View)
        res.setHeader('Content-Type', contentType);
        console.log("[DEBUG] ✅ Streaming started...");
        response.data.pipe(res);

    } catch (error) {
        console.error("Streaming error:", error);
        res.status(500).send("Error streaming content");
    }
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Gatekeeper Server running on http://localhost:${PORT}`);
});