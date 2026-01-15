import { useEffect, useState } from "react";
import { ethers } from "ethers"; 
import { Link } from "react-router-dom";
import axios from "axios";

import { marketplace } from "../services/marketplace";
import { accessPass } from "../services/accessPass";
import { getCurrentAddress } from "../services/wallet";
import { decryptFile } from "../services/lit";
import { CONTRACTS } from "../config/contracts";
import { getIpfsUrl } from "../services/ipfs";
import type { Product } from "../types/Product";

export default function MyLibrary() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); 
  const [account, setAccount] = useState<string>("");
  
  // Viewer State
  const [decryptingId, setDecryptingId] = useState<number | null>(null);
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [viewingType, setViewingType] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadMyProducts() {
      try {
        const addr = await getCurrentAddress();
        setAccount(addr.toLowerCase());

        const total = await marketplace.nextProductId();
        const ownedProducts: Product[] = [];

        for (let i = 1; i <= Number(total); i++) {
          const has = await accessPass.hasAccess(addr, i);
          if (!has) continue;

          const raw = await marketplace.products(i);

          ownedProducts.push({
            id: i,
            seller: raw[0],
            price: raw[1],
            isActive: raw[2],
            previewCid: raw[3],
            productCid: raw[4],     
            encryptedKey: raw[5],    
            contentType: raw[6],     
            soldCount: Number(raw[7]) 
          });
        }

        setProducts(ownedProducts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMyProducts();

    // ✅ CLEANUP ON UNMOUNT
    return () => {
      if (viewingUrl) {
        URL.revokeObjectURL(viewingUrl);
        console.log("🧹 Component unmounted: URL revoked");
      }
    };
  }, []);

  async function handleViewContent(p: Product) {
    if (!p.encryptedKey || !p.productCid) return alert("Product data incomplete.");

    try {
      setDecryptingId(p.id);
      
      // 1. Fetch Encrypted Blob (WITH RETRY)
      let blob: Blob | null = null;
      let lastError: any = null;
      const maxRetries = 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📥 FETCHING IPFS (attempt ${attempt}/${maxRetries})...`);
          
          const res = await axios.get(
            `http://localhost:3001/api/fetch/${p.productCid}`,
            {
              responseType: "blob",
              timeout: 120000, // 👈 TĂNG TIMEOUT LÊN 120 GIÂY (từ 30s mặc định)
            }
          );

          blob = res.data;

          // Check blob exists
          if (!blob) {
            throw new Error("Failed to fetch file from IPFS.");
          }

          // --- 🛡️ FIX: Validation Step ---
          // Check 1: If the file is tiny, it's likely an empty error
          if (blob.size < 100) {
            throw new Error("Downloaded file is too small (likely an IPFS error).");
          }

          // Check 2: If the MIME type is text/html, it's a gateway error page, not your file
          if (blob.type.includes("text/html") || blob.type.includes("application/json")) {
            const text = await blob.text();
            console.error("IPFS Error Response:", text);
            throw new Error("IPFS Gateway returned an error page instead of the file.");
          }
          // --------------------------------

          console.log(`✅ FETCH SUCCESS (attempt ${attempt})`);
          break; // Success, exit retry loop

        } catch (err: any) {
          lastError = err;
          console.error(`❌ ATTEMPT #${attempt} FAILED:`, err.message);

          // If it's a timeout error AND we have retries left, try again
          if (
            (err.code === "ECONNABORTED" || 
             err.message?.includes("504") || 
             err.message?.includes("timeout")) 
            && attempt < maxRetries
          ) {
            console.log(`⏳ WAITING 3 SECONDS BEFORE RETRY...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue; // Try again
          }

          // Otherwise, throw immediately
          throw err;
        }
      }

      if (!blob) {
        throw lastError || new Error("Failed to fetch file");
      }

      // 2. Decrypt
      console.log("🔐 DECRYPTING...");
      console.log("Debug Encrypted Key (Original):", p.encryptedKey);

      // 🛡️ FIX: Remove "0x" prefix if it exists
      const cleanKey = p.encryptedKey.startsWith("0x") 
        ? p.encryptedKey.slice(2) 
        : p.encryptedKey;

      console.log("Debug Encrypted Key (Clean):", cleanKey);

      const decryptedBlob = await decryptFile(
        blob, // 👈 blob is guaranteed not null here
        cleanKey, // 👈 USE THIS CLEAN KEY
        "amoy",
        CONTRACTS.amoy.AccessPass,
        p.id,
        p.contentType 
      );

      // 3. Create Memory URL
      const url = URL.createObjectURL(decryptedBlob);
      
      setViewingUrl(url);
      setViewingType(p.contentType);
      setIsModalOpen(true);

    } catch (error: any) {
      console.error("❌ VIEW CONTENT ERROR:", error);

      // Better error messages
      if (error.status === 504 || error.message?.includes("504")) {
        alert("❌ SERVER ERROR (504):\n\n❌ IPFS Proxy Server is not responding.\n\nPlease start the server:\n1. Open terminal in 'server' folder\n2. Run: npm install && npm run dev\n3. Wait for: '✅ IPFS Proxy Server running on http://localhost:3001'\n4. Then try again");
      } else if (error.code === "ECONNREFUSED") {
        alert("❌ CONNECTION REFUSED:\n\nServer (localhost:3001) is not running.\n\nStart it with: npm run dev");
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        alert("⏱️ Request timed out. File is too large or IPFS is slow. Please try again.");
      } else if (error.message?.includes("too small")) {
        alert("❌ IPFS returned empty file. Please try again later.");
      } else if (error.message?.includes("error page")) {
        alert("❌ IPFS gateway error. Please try again.");
      } else {
        alert("❌ Decryption failed: " + (error.message || "Unknown error"));
      }
    } finally {
      setDecryptingId(null);
    }
  }

  function closeViewer() {
    if (viewingUrl) {
      // ✅ REVOKE URL TO FREE MEMORY (CRITICAL!)
      URL.revokeObjectURL(viewingUrl);
      console.log("🧹 Memory cleaned: URL revoked");
    }
    setViewingUrl(null);
    setViewingType("");
    setIsModalOpen(false);
  }

  const preventCopy = (e: any) => e.preventDefault();

  if (loading) return <div style={{padding: 20}}>Loading your secure library...</div>;

  return (
    <div>
      <h1>My Library</h1>
      <p>Connected: {account}</p>

      <div style={{ marginBottom: 20 }}>
        <Link to="/"><button>Back to Marketplace</button></Link>
      </div>

      {products.length === 0 && <p>You have not purchased any products yet.</p>}

      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12, display: "flex", gap: "15px" }}>
          
          {/* ADD IMAGE BLOCK */}
          <div style={{ width: "100px", height: "100px", flexShrink: 0 }}>
             {p.previewCid ? (
               <img 
                 src={getIpfsUrl(p.previewCid)} 
                 alt={`Product ${p.id}`} 
                 style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
               />
             ) : (
               <div style={{ width: "100%", height: "100%", background: "#eee" }} />
             )}
          </div>

          <div style={{ flexGrow: 1 }}>
             <p><strong>ID:</strong> {p.id}</p>
             <p><strong>Price Paid:</strong> {ethers.formatEther(p.price)} ETH</p>
             <p><strong>Type:</strong> {p.contentType}</p>
             <p><strong>Status:</strong> <span style={{color: 'green'}}>Access Granted</span></p>

             <button onClick={() => handleViewContent(p)} disabled={decryptingId === p.id}>
               {decryptingId === p.id ? "⏳ Fetching & Decrypting (may take 1-2 min)..." : "View Content (Stream)"}
             </button>
          </div>
        </div>
      ))}

      {/* --- SECURE VIEWER MODAL --- */}
      {isModalOpen && viewingUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          
          <div style={{color: 'white', marginBottom: 10, textAlign: 'center'}}>
            <h3>Secure Viewer</h3>
            <p style={{fontSize: '0.8rem', color: '#aaa'}}>Protected Content. Do not distribute.</p>
          </div>

          <div style={{
            background: '#fff', padding: 0, borderRadius: 8, 
            width: '90vw', height: '80vh', overflow: 'hidden',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }} onContextMenu={preventCopy}>
            
            {/* 1. IMAGE */}
            {viewingType.startsWith('image/') && (
              <img src={viewingUrl} style={{maxWidth: '100%', maxHeight: '100%'}} alt="Secure Content" />
            )}

            {/* 2. AUDIO */}
            {viewingType.startsWith('audio/') && (
              <audio controls controlsList="nodownload" autoPlay style={{width: '80%'}}>
                <source src={viewingUrl} type={viewingType} />
              </audio>
            )}

            {/* 3. VIDEO */}
            {viewingType.startsWith('video/') && (
              <video controls controlsList="nodownload" autoPlay style={{maxWidth: '100%', maxHeight: '100%'}}>
                <source src={viewingUrl} type={viewingType} />
              </video>
            )}

            {/* 4. PDF (FIXED STYLE) */}
            {viewingType === 'application/pdf' && (
              <iframe 
                src={viewingUrl} 
                style={{width: '100%', height: '100%', border: 'none'}}
                title="Secure PDF"
              />
            )}

            {/* 5. TEXT/OTHER */}
            {!viewingType.startsWith('image/') && !viewingType.startsWith('audio/') && 
             !viewingType.startsWith('video/') && viewingType !== 'application/pdf' && (
               <div style={{color: 'black', padding: 20}}>
                 <p>File type ({viewingType}) cannot be streamed directly.</p>
                 <a href={viewingUrl} download="secure_file">Force Download</a>
               </div>
            )}
          </div>

          <button 
            onClick={closeViewer} 
            style={{marginTop: 20, padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer'}}
          >
            Close Viewer
          </button>
        </div>
      )}
    </div>
  );
}