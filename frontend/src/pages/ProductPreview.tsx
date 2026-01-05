import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { marketplace } from "../services/marketplace";
import { accessPass } from "../services/accessPass";
import { getCurrentAddress } from "../services/wallet";
import { buyProduct } from "../services/marketplaceWrite";
import { getIpfsUrl } from "../services/ipfs";
// import type { Product } from "../types/Product";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);

  const [product, setProduct] = useState<any>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const addr = await getCurrentAddress();
        setCurrentAddress(addr.toLowerCase());

        // Fetch raw struct from contract
        const raw = await marketplace.products(productId);
        
        // Convert to a usable object (matching your Home.tsx logic)
        // 0: seller, 1: price, 2: isActive, 3: previewCid, 
        // 4: productCid, 5: encryptedKey, 6: contentType, 7: soldCount
        const formattedProduct = {
          id: productId,
          seller: raw[0],
          price: raw[1],
          isActive: raw[2],
          previewCid: raw[3],
          productCid: raw[4],      // <--- Updated Field
          encryptedKey: raw[5],    // <--- Updated Field
          contentType: raw[6],
          soldCount: Number(raw[7]),
        };

        setProduct(formattedProduct);

        const owned = await accessPass.hasAccess(addr, productId);
        setHasAccess(owned);
      } catch (err) {
        console.error(err);
        setError("Failed to load product. Ensure the contract is deployed and ID is valid.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [productId]);

  async function handleBuy() {
    try {
      setBuying(true);
      await buyProduct(productId, product.price.toString());
      alert("Purchase successful");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Transaction failed");
    } finally {
      setBuying(false);
    }
  }

  if (loading) return <p style={{padding: 20}}>Loading product...</p>;
  if (error) return <p style={{padding: 20, color: "red"}}>{error}</p>;
  if (!product) return <p style={{padding: 20}}>Product not found</p>;

  const isSeller = product.seller.toLowerCase() === currentAddress;

  return (
    <div style={{ padding: 20 }}>
      <h1>Product #{productId}</h1>

      <Link to="/">
        <button style={{ marginBottom: 20 }}>&larr; Back to Marketplace</button>
      </Link>

      <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8, maxWidth: 600 }}>
        {/* PREVIEW IMAGE */}
        {product.previewCid && (
           <div style={{textAlign: 'center', marginBottom: 20}}>
             <img 
               src={getIpfsUrl(product.previewCid)} // <--- Updated to use Helper
               alt="Preview" 
               style={{maxWidth: "100%", maxHeight: 300, borderRadius: 4}}
             />
           </div>
        )}

        <p><strong>Price:</strong> {ethers.formatEther(product.price)} ETH</p>
        <p><strong>Type:</strong> {product.contentType}</p>
        <p><strong>Status:</strong> {product.isActive ? "Active" : "Inactive"}</p>
        <p><strong>Seller:</strong> {isSeller ? "You" : product.seller}</p>
        <p><strong>Sales:</strong> {product.soldCount}</p>
        
        {/* Debugging / Info */}
        <div style={{fontSize: '0.8rem', color: '#666', marginTop: 10, background: '#f5f5f5', padding: 10}}>
          <p>Product CID (Encrypted): {product.productCid}</p>
        </div>

        <hr style={{ margin: "20px 0" }} />

        {/* ACTION BUTTONS */}
        {isSeller ? (
          <p style={{ fontWeight: "bold", color: "#555" }}>You are the owner of this listing.</p>
        ) : hasAccess ? (
          <div>
            <p style={{ color: "green", fontWeight: "bold" }}>You own this product!</p>
            <Link to="/my-products">
              <button>Go to My Library to View</button>
            </Link>
          </div>
        ) : product.isActive ? (
          <button onClick={handleBuy} disabled={buying} style={{ padding: "10px 20px", fontSize: "1.1rem" }}>
            {buying ? "Processing..." : `Buy for ${ethers.formatEther(product.price)} ETH`}
          </button>
        ) : (
          <p style={{ color: "red" }}>This product is currently inactive and cannot be purchased.</p>
        )}

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}