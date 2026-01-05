import { ethers } from "ethers";
import { Link } from "react-router-dom";
import type { Product } from "../types/Product";
import { getIpfsUrl } from "../services/ipfs";

type ProductCardProps = {
  product: Product;
  currentAddress: string;
  isOwned: boolean;
  onBuy: (product: Product) => void;
};

export default function ProductCard({
  product,
  currentAddress,
  isOwned,
  onBuy,
}: ProductCardProps) {
  const isSeller = product.seller.toLowerCase() === currentAddress.toLowerCase();

  return (
    <div style={{ 
      border: "1px solid #ddd", 
      borderRadius: "8px", 
      padding: "16px", 
      marginBottom: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
    }}>
      {/* 🖼️ PREVIEW IMAGE SECTION (New Feature) */}
      <div style={{ 
        width: "100%", 
        height: "200px", 
        backgroundColor: "#f9f9f9", 
        marginBottom: "15px",
        borderRadius: "4px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {product.previewCid ? (
          <img 
            src={getIpfsUrl(product.previewCid)} 
            alt={`Product ${product.id}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        ) : (
          <span style={{ color: "#ccc" }}>No Preview</span>
        )}
      </div>

      {/* 📝 INFO SECTION (From Old Code) */}
      <h3 style={{ margin: "0 0 10px 0" }}>Product #{product.id}</h3>
      
      <div style={{ fontSize: "0.9rem", color: "#555", marginBottom: "15px" }}>
        <p style={{ margin: "5px 0" }}><strong>Price:</strong> {ethers.formatEther(product.price)} ETH</p>
        <p style={{ margin: "5px 0" }}><strong>Sold:</strong> {product.soldCount}</p>
        <p style={{ margin: "5px 0" }}><strong>Type:</strong> {product.contentType}</p>
        <p style={{ margin: "5px 0" }}><strong>Seller:</strong> {isSeller ? "You" : `${product.seller.slice(0, 6)}...`}</p>
      </div>

      {/* 🔘 ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "10px" }}>
        <Link to={`/product/${product.id}`} style={{ flex: 1 }}>
          <button style={{ width: "100%", cursor: "pointer", padding: "8px" }}>Details</button>
        </Link>

        {isOwned ? (
          <button disabled style={{ flex: 1, backgroundColor: "#e0e0e0", color: "#555", cursor: "not-allowed" }}>
            Owned
          </button>
        ) : isSeller ? (
          <button disabled style={{ flex: 1, backgroundColor: "#fff3cd", color: "#856404", border: "1px solid #ffeeba" }}>
            Your Listing
          </button>
        ) : product.isActive ? (
          <button 
            onClick={() => onBuy(product)} 
            style={{ flex: 1, backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer" }}
          >
            Buy Now
          </button>
        ) : (
          <button disabled style={{ flex: 1, backgroundColor: "#ccc", cursor: "not-allowed" }}>
            Inactive
          </button>
        )}
      </div>
    </div>
  );
}