import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marketplace } from "../services/marketplace";
import { buyProduct } from "../services/marketplaceWrite";
import { getCurrentAddress } from "../services/wallet";
import { accessPass } from "../services/accessPass";
import type { Product } from "../types/Product";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [ownedMap, setOwnedMap] = useState<Record<number, boolean>>({});
  const [buyingId, setBuyingId] = useState<number | null>(null); // FIX: tránh double-buy

  useEffect(() => {
    async function load() {
      try {
        const addr = await getCurrentAddress();
        const lowerAddr = addr.toLowerCase();
        setCurrentAddress(lowerAddr);

        const total = await marketplace.nextProductId();
        const owned: Record<number, boolean> = {};
        const list: Product[] = [];

        for (let i = 1; i <= Number(total); i++) {
          const raw = await marketplace.products(i);

          const product: Product = {
            id: i,
            seller: raw[0],
            price: raw[1],           // price is WEI (bigint)
            isActive: raw[2],
            previewCid: raw[3],
            productCid: raw[4],
            encryptedKey: raw[5],
            contentType: raw[6],
            soldCount: Number(raw[7]),
          };

          list.push(product);

          const has = await accessPass.hasAccess(addr, i);
          owned[i] = has;
        }

        setProducts(list);
        setOwnedMap(owned);
      } catch (e) {
        console.error("Error loading marketplace:", e);
      }
    }

    load();
  }, []);

  /* ================= BUY (FIXED) ================= */
  async function handleBuy(p: Product) {
    if (buyingId === p.id) return; // FIX: chặn double click

    try {
      setBuyingId(p.id);

      /* =================================================
         FIX QUAN TRỌNG NHẤT:
         - KHÔNG dùng p.price (cache)
         - LUÔN lấy price MỚI NHẤT từ contract
      ================================================= */
      const fresh = await marketplace.products(p.id);
      const freshPrice = fresh[1]; // on-chain price (wei)

      console.log("HOME BUY DEBUG");
      console.log("productId:", p.id);
      console.log("cached price (wei):", p.price.toString());
      console.log("fresh price (wei):", freshPrice.toString());

      await buyProduct(p.id, freshPrice.toString());

      /* FIX: update state, KHÔNG reload page */
      setOwnedMap(prev => ({
        ...prev,
        [p.id]: true,
      }));

      alert("✅ Purchase successful!");
    } catch (e: any) {
      console.error("BUY ERROR (HOME):", e);
      
      // Better error messages
      if (e.code === "INSUFFICIENT_FUNDS") {
        alert("❌ Insufficient balance to buy this product.");
      } else if (e.code === 4001 || e.code === "ACTION_REJECTED") {
        alert("❌ Transaction cancelled by user.");
      } else if (e.message?.includes("Price changed")) {
        alert("⚠️ Product price changed. Please try again.");
      } else if (e.message?.includes("Not Active")) {
        alert("⚠️ Product is no longer active.");
      } else if (e.message?.includes("already own")) {
        alert("ℹ️ You already own this product.");
      } else if (e.message?.includes("after retries")) {
        alert("❌ Purchase failed after multiple attempts. Product may have been sold. Please refresh and try again.");
      } else {
        alert("❌ Purchase failed. See console for details.");
      }
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div>
      <h1>Marketplace (on-chain)</h1>

      <div style={{ marginBottom: 20 }}>
        <Link to="/my-products" style={{ marginRight: 12 }}>
          <button>My Purchases</button>
        </Link>
        <Link to="/dashboard">
          <button>My Store</button>
        </Link>
      </div>

      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          currentAddress={currentAddress}
          isOwned={ownedMap[p.id]}
          onBuy={handleBuy} // FIXED handler
        />
      ))}
    </div>
  );
}
