import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const UploadProduct = ({ contract }) => {
  const [price, setPrice] = useState("");
  const [preview, setPreview] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!preview || !product || !price) return alert("Please fill all fields");
    setLoading(true);

    try {
      // 1. Upload files to your Backend Server
      const formData = new FormData();
      formData.append("preview", preview);
      formData.append("product", product);

      console.log("Uploading to server...");
      // IMPORTANT: This points to your Node.js server
      const res = await axios.post("http://localhost:3001/api/upload", formData);
      
      const { previewCid, productCid, contentType } = res.data;
      console.log("IPFS CIDs:", { previewCid, productCid });

      // 2. Create Listing on Blockchain
      console.log("Confirming on Blockchain...");
      const priceWei = ethers.parseEther(price);
      
      const tx = await contract.listProduct(
        priceWei,
        previewCid,
        productCid,
        contentType
      );
      await tx.wait(); // Wait for transaction to finish
      
      alert("✅ Product Listed Successfully!");
      window.location.reload(); // Refresh page to see new item

    } catch (error) {
      console.error(error);
      alert("Error: " + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", maxWidth: "500px" }}>
      <div style={{ marginBottom: "10px" }}>
        <label>Price (ETH):</label>
        <input 
          type="text" 
          value={price}
          onChange={(e) => setPrice(e.target.value)} 
          placeholder="0.01"
          style={{ marginLeft: "10px" }}
        />
      </div>
      
      <div style={{ marginBottom: "10px" }}>
        <label>Preview Image (Public):</label>
        <input type="file" onChange={(e) => setPreview(e.target.files[0])} />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Digital Product (Private PDF/MP3):</label>
        <input type="file" onChange={(e) => setProduct(e.target.files[0])} />
      </div>

      <button onClick={handleUpload} disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
        {loading ? "Processing..." : "List Product"}
      </button>
    </div>
  );
};

export default UploadProduct;