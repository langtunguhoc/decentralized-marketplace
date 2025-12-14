import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import AccessPassAbi from "./abi/AccessPass.json";
import contractAddress from "./abi/contract-address.json";

const ProductList = ({ contract, account }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, [contract, account]);

  const loadProducts = async () => {
    // 1. Connect to AccessPass Contract to check ownership
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const apContract = new ethers.Contract(contractAddress.accessPass, AccessPassAbi.abi, signer);

    // 2. Get total product count
    const count = await contract.nextProductId();
    let items = [];
    
    // 3. Loop through all products
    for (let i = 1; i <= count; i++) {
      const p = await contract.products(i);
      
      // Check if current user owns this product
      const hasAccess = await apContract.hasAccess(account, i);
      
      items.push({
        id: i,
        seller: p.seller,
        price: ethers.formatEther(p.price),
        previewCid: p.previewCid,
        hasAccess: hasAccess
      });
    }
    setProducts(items);
  };

  const buyProduct = async (id, price) => {
    try {
      const tx = await contract.buyProduct(id, { value: ethers.parseEther(price) });
      await tx.wait();
      alert("Bought! refreshing...");
      loadProducts();
    } catch (err) {
      alert("Error buying: " + err.message);
    }
  };

  const viewProduct = async (id) => {
    console.log(`[FRONTEND] 1. User clicked View for Product #${id}`); // <--- ADD THIS

    try {
      console.log("[FRONTEND] 2. Sending request to server...");       // <--- ADD THIS
      
      const response = await axios.get(`http://localhost:3001/api/consume/${id}`, {
        headers: { "x-user-address": account },
        responseType: "blob"
      });

      console.log("[FRONTEND] 3. Server responded!", response);  
      
      // Check what type of file we actually got
      const mimeType = response.headers['content-type'];
      console.log(`[FRONTEND] 4. File Type received: ${mimeType}`); 

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      console.log(`[FRONTEND] 5. Opening Blob URL: ${url}`); 
      window.open(url, "_blank");
      
    } catch (err) {
      console.error("[FRONTEND] ❌ Error:", err);
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #444", padding: "15px", borderRadius: "10px", width: "250px" }}>
          {/* Show Public Preview from Pinata */}
          <img 
            src={`https://gateway.pinata.cloud/ipfs/${p.previewCid}`} 
            alt="Preview" 
            style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "5px" }} 
          />
          
          <h3>Product #{p.id}</h3>
          <p>Price: {p.price} ETH</p>
          
          {p.hasAccess ? (
            <button 
              onClick={() => viewProduct(p.id)}
              style={{ backgroundColor: "#4CAF50", color: "white", width: "100%", padding: "10px", cursor: "pointer", border: "none" }}
            >
              🔓 View Content (Secure)
            </button>
          ) : (
            <button 
              onClick={() => buyProduct(p.id, p.price)}
              style={{ backgroundColor: "#008CBA", color: "white", width: "100%", padding: "10px", cursor: "pointer", border: "none" }}
            >
              Buy Now
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProductList;