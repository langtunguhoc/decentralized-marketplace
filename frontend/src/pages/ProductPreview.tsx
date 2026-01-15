import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { marketplace } from "../services/marketplace";
import { accessPass } from "../services/accessPass";
import { getCurrentAddress } from "../services/wallet";
import { buyProduct } from "../services/marketplaceWrite";
import { getIpfsUrl } from "../services/ipfs";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);

  const [product, setProduct] = useState<any>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= LOAD PRODUCT ================= */
  useEffect(() => {
    async function load() {
      try {
        const addr = await getCurrentAddress();
        setCurrentAddress(addr.toLowerCase());

        const raw = await marketplace.products(productId);

        const formattedProduct = {
          id: productId,
          seller: raw[0],
          price: raw[1],
          isActive: raw[2],
          previewCid: raw[3],
          productCid: raw[4],
          encryptedKey: raw[5],
          contentType: raw[6],
          soldCount: Number(raw[7]),
        };

        setProduct(formattedProduct);

        const owned = await accessPass.hasAccess(addr, productId);
        setHasAccess(owned);
      } catch (err) {
        console.error(err);
        setError("Failed to load product. Invalid ID or contract issue.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [productId]);

  /* ================= BUY PRODUCT (FIXED) ================= */
  async function handleBuy() {
  if (!product) return;

  /* --- FIX 1: FRONTEND GUARDS (TRÁNH REVERT) --- */
  if (!product.isActive) {
    setError("This product is inactive.");
    return;
  }

  if (hasAccess) {
    setError("You already own this product.");
    return;
  }

  if (product.seller.toLowerCase() === currentAddress) {
    setError("You cannot buy your own product.");
    return;
  }

  try {
    setBuying(true);
    setError(null);

    /* ================= DEBUG: UI STATE ================= */
    console.log("===== BUY DEBUG (UI STATE) =====");
    console.log("productId:", productId);
    console.log("buyer:", currentAddress);
    console.log("seller:", product.seller);
    console.log("isSeller:", product.seller.toLowerCase() === currentAddress);
    console.log("hasAccess (frontend):", hasAccess);
    console.log("isActive (frontend):", product.isActive);
    console.log("cached price (wei):", product.price.toString());
    console.log("cached price (eth):", ethers.formatEther(product.price));
    console.log("================================");

    /* --- FIX 2: LUÔN LẤY PRICE MỚI NHẤT TỪ CONTRACT --- */
    const fresh = await marketplace.products(productId);
    const freshPrice = fresh[1]; // price on-chain

    /* ================= DEBUG: ON-CHAIN STATE ================= */
    console.log("===== BUY DEBUG (ON-CHAIN STATE) =====");
    console.log("seller (on-chain):", fresh[0]);
    console.log("price (wei, on-chain):", freshPrice.toString());
    console.log("price (eth, on-chain):", ethers.formatEther(freshPrice));
    console.log("isActive (on-chain):", fresh[2]);
    console.log("soldCount:", Number(fresh[7]));
    console.log("====================================");

    /* --- FIX 3: GỌI BUY VỚI PRICE MỚI --- */
    await buyProduct(productId, freshPrice.toString());

    console.log("BUY TX SENT SUCCESSFULLY");

    /* --- FIX 4: UPDATE STATE, KHÔNG RELOAD PAGE --- */
    setHasAccess(true);

  } catch (err: any) {
    console.error("===== BUY ERROR =====", err);

    /* --- FIX 5: HANDLE METAMASK & REVERT GỌN GÀNG --- */
    if (err.code === "INSUFFICIENT_FUNDS") {
      setError("Insufficient balance to buy this product.");
      return;
    }

    if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      setError("Transaction cancelled by user.");
      return;
    }

    if (err.message?.includes("Price changed")) {
      setError("Product price changed. Please refresh and try again.");
      return;
    }

    if (err.message?.includes("Not Active")) {
      setError("Product is no longer active.");
      return;
    }

    if (err.message?.includes("after retries")) {
      setError("Purchase failed after multiple attempts. Product may have been sold. Try refreshing.");
      return;
    }

    // JSON-RPC -32603 (contract revert)
    setError("Purchase failed. Product state may have changed.");
  } finally {
    setBuying(false);
  }
}


  /* ================= RENDER ================= */
  if (loading) return <p style={{ padding: 20 }}>Loading product...</p>;
  if (error && !product) return <p style={{ padding: 20, color: "red" }}>{error}</p>;
  if (!product) return <p style={{ padding: 20 }}>Product not found</p>;

  const isSeller = product.seller.toLowerCase() === currentAddress;

  return (
    <div style={{ padding: 20 }}>
      <h1>Product #{productId}</h1>

      <Link to="/">
        <button style={{ marginBottom: 20 }}>Back to Marketplace</button>
      </Link>

      <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8, maxWidth: 600 }}>
        {/* PREVIEW IMAGE */}
        {product.previewCid && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img
              src={getIpfsUrl(product.previewCid)}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 4 }}
            />
          </div>
        )}

        <p><strong>Price:</strong> {ethers.formatEther(product.price)} ETH</p>
        <p><strong>Type:</strong> {product.contentType}</p>
        <p><strong>Status:</strong> {product.isActive ? "Active" : "Inactive"}</p>
        <p><strong>Seller:</strong> {isSeller ? "You" : product.seller}</p>
        <p><strong>Sales:</strong> {product.soldCount}</p>

        {/* DEBUG INFO */}
        <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 10 }}>
          <p>Product CID (Encrypted): {product.productCid}</p>
        </div>

        <hr style={{ margin: "20px 0" }} />

        {/* ACTIONS */}
        {isSeller ? (
          <p style={{ fontWeight: "bold", color: "#555" }}>
            You are the owner of this listing.
          </p>
        ) : hasAccess ? (
          <div>
            <p style={{ color: "green", fontWeight: "bold" }}>
              You already own this product.
            </p>
            <Link to="/my-products">
              <button>Go to My Library</button>
            </Link>
          </div>
        ) : product.isActive ? (
          <button
            onClick={handleBuy}
            disabled={buying}
            style={{ padding: "10px 20px", fontSize: "1.1rem" }}
          >
            {buying ? "Processing..." : `Buy for ${ethers.formatEther(product.price)} ETH`}
          </button>
        ) : (
          <p style={{ color: "red" }}>
            This product is currently inactive.
          </p>
        )}

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}
