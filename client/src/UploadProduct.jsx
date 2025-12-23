import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { encryptFile } from "./lit";
import contractAddress from "./abi/contract-address.json";

const UploadProduct = ({ contract }) => {
  const [price, setPrice] = useState("");
  const [preview, setPreview] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⚠️ Chain must match AccessPass contract deployment
  const CHAIN_NAME = "amoy"; 

  // --- 🛠️ Helper: Convert Base64 to Blob for Upload ---
  const base64ToBlob = (base64Data, contentType = 'application/octet-stream') => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleUpload = async () => {
    if (!preview || !product || !price) return alert("Please fill all fields");
    setLoading(true);

    try {
      console.log("🔒 Encrypting File in Browser...");
      
      const nextId = await contract.nextProductId();
      const predictedId = Number(nextId) + 1; 

      // 1. Encrypt (Returns Base64 String)
      const { encryptedFileBlob, encryptedKey } = await encryptFile(
        product,
        CHAIN_NAME, 
        contractAddress.accessPass,
        predictedId
      );

      // 2. Convert Base64 String -> File Object (Fixes 400 Error)
      console.log("📦 Converting encrypted string to File...");
      const encryptedBlob = base64ToBlob(encryptedFileBlob);
      const encryptedFile = new File([encryptedBlob], product.name, { type: product.type });

      // 3. Upload Encrypted Data to Server
      const formData = new FormData();
      formData.append("preview", preview);
      formData.append("product", encryptedFile); // Now sending a real File!

      console.log("📤 Uploading to IPFS...");
      const res = await axios.post("http://localhost:3001/api/upload", formData);
      const { previewCid, productCid, contentType } = res.data;

      // 4. List on Blockchain
      console.log("📝 Listing on Blockchain...");
      const tx = await contract.listProduct(
        ethers.parseEther(price),
        previewCid,
        productCid,
        encryptedKey, 
        contentType,
        {
           gasLimit: 3000000, 
           maxPriorityFeePerGas: ethers.parseUnits("50", "gwei"),
           maxFeePerGas: ethers.parseUnits("50", "gwei") 
        }
      );
      await tx.wait();
      
      alert("✅ Securely Listed with Lit Protocol!");
      window.location.reload();

    } catch (error) {
      console.error(error);
      alert("Error: " + (error.response?.statusText || error.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
        <h3>Upload Secure Product</h3>
        <div style={{ marginBottom: "10px" }}>
            <label>Price (ETH): </label>
            <input type="text" onChange={e => setPrice(e.target.value)} placeholder="0.1"/>
        </div>
        <div style={{ marginBottom: "10px" }}>
            <label>Preview Image: </label>
            <input type="file" onChange={e => setPreview(e.target.files[0])} />
        </div>
        <div style={{ marginBottom: "10px" }}>
            <label>Secret File (PDF/MP3): </label>
            <input type="file" onChange={e => setProduct(e.target.files[0])} />
        </div>
        <button onClick={handleUpload} disabled={loading} style={{ padding: "10px 20px" }}>
            {loading ? "Encrypting & Uploading..." : "List Product"}
        </button>
    </div>
  );
};
export default UploadProduct;