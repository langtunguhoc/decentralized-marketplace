import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { marketplace } from "../services/marketplace";
import { accessPass } from "../services/accessPass";
import { getCurrentAddress } from "../services/wallet";
import { buyProduct } from "../services/marketplaceWrite";

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

        const raw = await marketplace.products(productId);
        setProduct(raw);

        const owned = await accessPass.hasAccess(addr, productId);
        setHasAccess(owned);
      } catch {
        setError("Failed to load product");
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

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found</p>;

  const isSeller =
    product.seller.toLowerCase() === currentAddress;

  return (
    <div>
      <h1>Product #{productId}</h1>

      {/* BACK */}
      <Link to="/">
        <button>Back to Marketplace</button>
      </Link>

      <hr />

      {/* PREVIEW AREA */}
      <p>
        <strong>Price:</strong>{" "}
        {ethers.formatEther(product.price)} ETH
      </p>
      <p>
        <strong>Status:</strong>{" "}
        {product.isActive ? "Active" : "Inactive"}
      </p>
      <p>
        <strong>Seller:</strong>{" "}
        {isSeller ? "You" : product.seller}
      </p>

      <p>
        <strong>Preview CID:</strong>{" "}
        {product.previewCid}
      </p>

      <p>
        <strong>Metadata CID:</strong>{" "}
        {product.metadataCid}
      </p>

      <hr />

      {/* ACTION */}
      {isSeller ? (
        <p>You are the owner</p>
      ) : hasAccess ? (
        <p style={{ color: "green" }}>
          You already own this product
        </p>
      ) : product.isActive ? (
        <button onClick={handleBuy} disabled={buying}>
          {buying ? "Buying..." : "Buy"}
        </button>
      ) : (
        <p style={{ color: "red" }}>
          This product is inactive
        </p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
