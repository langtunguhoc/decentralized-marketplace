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
  const [currentAddress, setCurrentAddress] =
    useState<string>("");
  const [ownedMap, setOwnedMap] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    async function load() {
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
          price: raw[1],
          isActive: raw[2],
          previewCid: raw[3],
          metadataCid: raw[4],
          contentType: raw[5],
          soldCount: Number(raw[6]),
        };

        list.push(product);

        const has = await accessPass.hasAccess(addr, i);
        owned[i] = has;
      }

      setProducts(list);
      setOwnedMap(owned);
    }

    load();
  }, []);

  async function handleBuy(p: Product) {
    await buyProduct(p.id, p.price.toString());
    alert("Purchase successful");
    window.location.reload();
  }

  return (
    <div>
      <h1>Marketplace (on-chain)</h1>

      {/* DASHBOARD BUTTONS */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/my-products" style={{ marginRight: 12 }}>
          <button>My Purchases</button>
        </Link>

        <Link to="/dashboard">
          <button>My Store</button>
        </Link>
      </div>

      {/* PRODUCT LIST */}
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
