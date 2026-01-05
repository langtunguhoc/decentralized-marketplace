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

          // Contract Struct:
          // 0: seller, 1: price, 2: isActive, 3: previewCid
          // 4: productCid, 5: encryptedKey, 6: contentType, 7: soldCount
          
          const product: Product = {
            id: i,
            seller: raw[0],
            price: raw[1],
            isActive: raw[2],
            previewCid: raw[3],
            productCid: raw[4],      // Fixed mapping
            encryptedKey: raw[5],    // Fixed mapping
            contentType: raw[6],     // Fixed mapping
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

  async function handleBuy(p: Product) {
    try {
      await buyProduct(p.id, p.price.toString());
      alert("Purchase successful! Check 'My Purchases'.");
      window.location.reload();
    } catch(e: any) {
      alert("Purchase failed: " + e.message);
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
          onBuy={handleBuy}
        />
      ))}
    </div>
  );
}