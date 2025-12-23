import { useEffect, useState } from "react";
import { ethers } from "ethers";
import AccessPassAbi from "./abi/AccessPass.json";
import contractAddress from "./abi/contract-address.json";
import { decryptFile } from "./lit";

const ProductList = ({ contract, account }) => {
  const [products, setProducts] = useState([]);
  
  // 🛡️ State for Secure Viewer
  const [viewingFile, setViewingFile] = useState(null); // { url, type }

  // ⚠️ Ensure this matches your upload chain
  const CHAIN_NAME = "amoy"; 

  useEffect(() => { loadProducts(); }, [contract]);

  const loadProducts = async () => {
    if (!contract) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const apContract = new ethers.Contract(contractAddress.accessPass, AccessPassAbi.abi, signer);

    const count = await contract.nextProductId();
    let items = [];
    
    for (let i = 1; i <= count; i++) {
      const p = await contract.products(i);
      // Skip empty/deleted products
      if(p.seller === ethers.ZeroAddress) continue;

      const hasAccess = await apContract.hasAccess(account, i);
      
      items.push({
        id: i,
        seller: p.seller,
        price: ethers.formatEther(p.price),
        previewCid: p.previewCid,
        productCid: p.productCid,
        encryptedKey: p.encryptedKey,
        isActive: p.isActive,
        contentType: p.contentType,
        hasAccess: hasAccess
      });
    }
    setProducts(items);
  };

  const buyProduct = async (id, price) => {
    try {
      const tx = await contract.buyProduct(id, { value: ethers.parseEther(price) });
      await tx.wait();
      alert("Purchase Successful!");
      loadProducts();
    } catch (err) {
      alert("Error buying: " + err.message);
    }
  };

  const viewProduct = async (p) => {
    try {
      alert("🔐 Please sign the MetaMask popup to decrypt...");
      
      // 1. Download via Local Proxy (Fixes CORS Error)
      // We hit our own server, which then hits IPFS
      const res = await fetch(`http://localhost:3001/api/fetch/${p.productCid}`);
      
      if (!res.ok) throw new Error("Proxy Fetch Failed");
      
      const encryptedBlob = await res.blob();

      // 2. Decrypt with Lit (Returns Uint8Array)
      const decryptedBytes = await decryptFile(
        encryptedBlob,
        p.encryptedKey,
        CHAIN_NAME, 
        contractAddress.accessPass,
        p.id
      );

      // 3. Convert Raw Bytes to a Blob (Fixes Viewer Crash)
      const fileBlob = new Blob([decryptedBytes], { type: p.contentType });

      // 4. Create Secure Link
      const url = window.URL.createObjectURL(fileBlob);

      // 5. Open Custom Viewer
      setViewingFile({ url, type: p.contentType });

      // 6. 🛡️ Security: Destroy link in memory after 1 second
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log("💣 Secure Link Destroyed from Memory");
      }, 1000);

    } catch (err) {
      console.error(err);
      alert("Decryption/Download Failed! Check console for details.");
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #444", padding: "15px", borderRadius: "10px", width: "250px" }}>
          <img 
            src={`https://gateway.pinata.cloud/ipfs/${p.previewCid}`} 
            style={{ width: "100%", height: "150px", objectFit: "cover" }} 
            alt="Preview"
          />
          <h3>Product #{p.id}</h3>
          <p>{p.price} ETH</p>
          
          {p.hasAccess ? (
            <button 
              onClick={() => viewProduct(p)}
              style={{ backgroundColor: "#4CAF50", color: "white", width: "100%", padding: "10px", border: "none", cursor: "pointer" }}
            >
              🔓 Decrypt & View
            </button>
          ) : (
            <button 
              onClick={() => buyProduct(p.id, p.price)}
              style={{ backgroundColor: "#008CBA", color: "white", width: "100%", padding: "10px", border: "none", cursor: "pointer" }}
            >
              Buy Now
            </button>
          )}
        </div>
      ))}

      {/* --- 🛡️ SECURE VIEWER MODAL --- */}
      {viewingFile && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.95)", zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          
          <button 
            onClick={() => setViewingFile(null)}
            style={{ position: "absolute", top: 20, right: 30, fontSize: "24px", cursor: "pointer", zIndex: 10001, background:"none", border:"none", color:"white" }}
          >
            ❌ Close
          </button>

          {/* PDF Viewer */}
          {viewingFile.type === "application/pdf" && (
            <iframe 
              src={`${viewingFile.url}#toolbar=0&navpanes=0&scrollbar=0`} 
              style={{ width: "80%", height: "90%", border: "none", background: "white" }}
              title="Secure Viewer"
            />
          )}

          {/* Audio/Video */}
          {(viewingFile.type.startsWith("video/") || viewingFile.type.startsWith("audio/")) && (
            <video 
              controls 
              controlsList="nodownload" 
              src={viewingFile.url} 
              style={{ maxWidth: "90%", maxHeight: "90%" }}
            />
          )}

          {/* Images */}
          {viewingFile.type.startsWith("image/") && (
            <img src={viewingFile.url} style={{ maxWidth: "90%", maxHeight: "90%" }} alt="Secure Content" />
          )}

          <div 
            onContextMenu={(e) => e.preventDefault()}
            style={{ position: "absolute", width: "100%", height: "100%", zIndex: 9998, pointerEvents: "none" }}
          />
        </div>
      )}
    </div>
  );
};
export default ProductList;