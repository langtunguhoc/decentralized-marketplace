const express = require('express');
const cors = require('cors');
const multer = require('multer');
const https = require('https'); 
const { uploadToIPFS } = require('./pinata'); 
require('dotenv').config();

// SETUP
const app = express();
app.use(cors());
app.use(express.json());

// Store files in RAM temporarily
const upload = multer({ storage: multer.memoryStorage() });

// ==================================================================
// ROUTE 1: UPLOAD PROXY
// ==================================================================
const uploadFields = upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'product', maxCount: 1 }
]);

app.post('/api/upload', uploadFields, async (req, res) => {
    try {
        const files = req.files;
        if (!files || !files.preview || !files.product) {
            return res.status(400).json({ error: "Missing files" });
        }

        console.log("1. Uploading Public Preview...");
        const previewCid = await uploadToIPFS(
            files.preview[0].buffer, 
            files.preview[0].originalname, 
            files.preview[0].mimetype
        );

        console.log("2. Uploading Encrypted Product...");
        const productCid = await uploadToIPFS(
            files.product[0].buffer, 
            "encrypted.bin", 
            "application/octet-stream" 
        );

        res.json({
            success: true,
            previewCid,
            productCid,
            contentType: files.product[0].mimetype 
        });

    } catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ error: "Server upload failed" });
    }
});

// ==================================================================
// ROUTE 2: DOWNLOAD PROXY (✅ FIXED)
// ==================================================================
app.get('/api/fetch/:cid', (req, res) => {
    const { cid } = req.params;

    // 🛡️ FIX: Use Dedicated Gateway if available, otherwise use a generic public one.
    // Pinata Gateway env var is usually just the domain: "example.mypinata.cloud"
    const gateway = process.env.PINATA_GATEWAY || 'ipfs.io'; 
    const ipfsUrl = `https://${gateway}/ipfs/${cid}`;

    console.log(`[Proxy] Fetching ${cid} from: ${ipfsUrl}`);

    https.get(ipfsUrl, (stream) => {
        // Handle non-200 status codes (like 404 or 504)
        if (stream.statusCode !== 200) {
            console.error(`[Proxy] Gateway returned status: ${stream.statusCode}`);
            // Consume the stream to free memory
            stream.resume();
            return res.status(stream.statusCode).json({ error: "Gateway error" });
        }

        // Forward the content type header
        if (stream.headers['content-type']) {
            res.setHeader('Content-Type', stream.headers['content-type']);
        } else {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
        
        // Pipe the data directly to the client
        stream.pipe(res);

    }).on('error', (err) => {
        console.error("[Proxy] IPFS Download Error:", err.message);
        res.status(500).json({ error: "Failed to fetch from IPFS" });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ IPFS Proxy Server running on http://localhost:${PORT}`);
});