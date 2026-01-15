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

  const isSeller =
    product.seller.toLowerCase() === currentAddress.toLowerCase();

  /* ===== DEBUG BUY CLICK (QUAN TRỌNG) ===== */
  function handleBuyClick() {
    console.log("===== PRODUCT CARD BUY CLICK =====");
    console.log("productId:", product.id);
    console.log("price (wei):", product.price.toString());
    console.log("price (eth):", ethers.formatEther(product.price));
    console.log("seller:", product.seller);
    console.log("buyer:", currentAddress);
    console.log("isSeller:", isSeller);
    console.log("isActive:", product.isActive);
    console.log("soldCount:", product.soldCount);
    console.log("=================================");

    onBuy(product);
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "20px",
        backgroundColor: "#fff",
      }}
    >
      {/* PREVIEW IMAGE */}
      <div
        style={{
          width: "100%",
          height: "200px",
          backgroundColor: "#f9f9f9",
          marginBottom: "15px",
          borderRadius: "4px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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

      {/* INFO */}
      <h3 style={{ margin: "0 0 10px 0" }}>
        Product #{product.id}
      </h3>

      <div style={{ fontSize: "0.9rem", color: "#555", marginBottom: "15px" }}>
        <p><strong>Price:</strong> {ethers.formatEther(product.price)} ETH</p>
        <p><strong>Sold:</strong> {product.soldCount}</p>
        <p><strong>Type:</strong> {product.contentType}</p>
        <p>
          <strong>Seller:</strong>{" "}
          {isSeller ? "You" : `${product.seller.slice(0, 6)}...`}
        </p>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: "10px" }}>
        <Link to={`/product/${product.id}`} style={{ flex: 1 }}>
          <button style={{ width: "100%" }}>Details</button>
        </Link>

        {isOwned ? (
          <button disabled style={{ flex: 1 }}>
            Owned
          </button>
        ) : isSeller ? (
          <button disabled style={{ flex: 1 }}>
            Your Product
          </button>
        ) : product.isActive ? (
          <button
            onClick={handleBuyClick}   // <-- FIX: LOG + BUY
            style={{ flex: 1 }}
          >
            Buy Now
          </button>
        ) : (
          <button disabled style={{ flex: 1 }}>
            Inactive
          </button>
        )}
      </div>
    </div>
  );
}
