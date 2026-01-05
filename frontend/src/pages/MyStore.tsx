import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { ethers } from "ethers";
import axios from "axios";

import { marketplace } from "../services/marketplace";
import { createProduct, updateListing } from "../services/marketplaceWrite";
import { getCurrentAddress } from "../services/wallet";
import { encryptFile } from "../services/lit";
import { CONTRACTS } from "../config/contracts";

type Product = {
  seller: string;
  price: bigint;
  isActive: boolean;
  previewCid: string;
  productCid: string;
  encryptedKey: string;
  contentType: string;
  soldCount: bigint;
};

export default function MyStore() {
  const [products, setProducts] = useState<(Product & { id: number })[]>([]);
  
  // Form State
  const [price, setPrice] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSellerProducts();
  }, []);

  async function loadSellerProducts() {
    const addr = (await getCurrentAddress()).toLowerCase();
    setAccount(addr);

    const nextId = await marketplace.nextProductId();
    const items: (Product & { id: number })[] = [];

    for (let i = 1; i <= Number(nextId); i++) {
      const raw = await marketplace.products(i);

      // Contract Struct Order:
      // 0: seller, 1: price, 2: isActive, 3: previewCid, 
      // 4: productCid, 5: encryptedKey, 6: contentType, 7: soldCount
      
      if (raw[0].toLowerCase() === addr) {
        items.push({
          seller: raw[0],
          price: raw[1],
          isActive: raw[2],
          previewCid: raw[3],
          productCid: raw[4],
          encryptedKey: raw[5], // <--- Essential for updates
          contentType: raw[6],
          soldCount: raw[7],
          id: i 
        });
      }
    }
    setProducts(items);
  }

  // Helper: Convert Base64 (from Lit) back to Blob for upload
  const base64ToBlob = (base64Data: string, contentType = 'application/octet-stream') => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  };

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!previewFile || !productFile || !price) return alert("Please fill all fields");
    setLoading(true);

    try {
      console.log("🔒 Encrypting File...");
      const nextId = await marketplace.nextProductId();
      const predictedId = Number(nextId) + 1; 
      
      // 1. Encrypt with Lit
      const { encryptedFileBlob, encryptedKey } = await encryptFile(
        productFile,
        "amoy", 
        CONTRACTS.amoy.AccessPass, 
        predictedId
      );

      // 2. Prepare for Upload
      const encryptedBlob = base64ToBlob(encryptedFileBlob);
      const encryptedFile = new File([encryptedBlob], productFile.name, { type: productFile.type });

      const formData = new FormData();
      formData.append("preview", previewFile);
      formData.append("product", encryptedFile);

      // 3. Upload to Proxy Server
      console.log("📤 Uploading to IPFS...");
      const res = await axios.post("http://localhost:3001/api/upload", formData);
      const { previewCid, productCid, contentType } = res.data;

      // 4. Write to Blockchain
      console.log("📝 Listing on Blockchain...");
      await createProduct(
        price,
        previewCid,
        productCid,
        encryptedKey,
        contentType
      );

      alert("✅ Product Listed Successfully!");
      
      // Reset Form
      setPrice("");
      setPreviewFile(null);
      setProductFile(null);
      loadSellerProducts();

    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.message || "Upload failed"));
    }
    setLoading(false);
  }

  // Re-added this function to use updateListing
  async function toggleActive(p: Product & { id: number }) {
    if(p.soldCount > 0n) {
        alert("Cannot update a product that has already been sold.");
        return;
    }

    try {
        await updateListing(
            p.id,
            ethers.formatEther(p.price), // Must convert back to string ETH for the service
            p.previewCid,
            p.productCid,
            p.encryptedKey,
            p.contentType,
            !p.isActive // Toggle boolean
        );
        loadSellerProducts();
    } catch (error: any) {
        console.error(error);
        alert("Update failed: " + error.message);
    }
  }

  return (
    <div>
      <h1>My Store</h1>
      <p>Connected: {account}</p>

      <div style={{ marginBottom: 20 }}>
        <Link to="/"><button>Back to Marketplace</button></Link>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8 }}>
        <h3>Create New Product</h3>
        <form onSubmit={handleCreateProduct}>
          <div style={{ marginBottom: 10 }}>
            <label>Price (ETH): </label>
            <input
              type="text"
              placeholder="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          
          <div style={{ marginBottom: 10 }}>
            <label>Preview Image (Public): </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setPreviewFile(e.target.files ? e.target.files[0] : null)} 
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label>Product File (Encrypted): </label>
            <input 
              type="file" 
              onChange={(e) => setProductFile(e.target.files ? e.target.files[0] : null)} 
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Encrypting & Uploading..." : "Create Product"}
          </button>
        </form>
      </div>

      <hr />

      <h2>Your Products</h2>
      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", margin: "10px 0", padding: 10 }}>
          <p><strong>ID:</strong> {p.id}</p>
          <p><strong>Price:</strong> {ethers.formatEther(p.price)} ETH</p>
          <p><strong>Status:</strong> {p.isActive ? "Active" : "Inactive"}</p>
          <p><strong>Sales:</strong> {Number(p.soldCount)}</p>
          
          <button onClick={() => toggleActive(p)} disabled={p.soldCount > 0n}>
            {p.isActive ? "Deactivate" : "Activate"}
          </button>
          
          {p.soldCount > 0n && <span style={{marginLeft: 10, color: 'red', fontSize: '0.8em'}}>Cannot update sold items</span>}
        </div>
      ))}
    </div>
  );
}