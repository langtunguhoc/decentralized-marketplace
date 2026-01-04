import { ethers } from "ethers";
import { Link } from "react-router-dom";
import type { Product } from "../types/Product";

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
    product.seller.toLowerCase() === currentAddress;

  function shortAddress(addr: string) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 12,
        marginBottom: 12,
      }}
    >
      <p>ID: {product.id}</p>
      <p>
        Price: {ethers.formatEther(product.price)} ETH
      </p>
      <p>Sold: {product.soldCount}</p>
      <p>
        Seller:{" "}
        {isSeller
          ? "You"
          : shortAddress(product.seller)}
      </p>

      {/* ACTION AREA */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* PREVIEW */}
        <Link to={`/product/${product.id}`}>
          <button>Preview</button>
        </Link>

        {/* BUY / STATUS */}
        {isSeller ? (
          <p style={{ color: "gray" }}>
            You are the owner
          </p>
        ) : isOwned ? (
          <p style={{ color: "green" }}>
            You already own this product
          </p>
        ) : product.isActive ? (
          <button onClick={() => onBuy(product)}>
            Buy
          </button>
        ) : (
          <p style={{ color: "red" }}>Inactive</p>
        )}
      </div>
    </div>
  );
}
