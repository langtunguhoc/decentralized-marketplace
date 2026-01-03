import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom"; // <-- thêm
import { marketplace } from "../services/marketplace";
import { accessPass } from "../services/accessPass";
import { getCurrentAddress } from "../services/wallet";
import type { Product } from "../types/Product";

export default function MyPurchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string>("");

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
            metadataCid: raw[4],
            contentType: raw[5],
            soldCount: Number(raw[6]),
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
  }, []);

  if (loading) {
    return <p>Loading your purchased products...</p>;
  }

  return (
    <div>
      <h1>My Purchases</h1>
      <p>Connected: {account}</p>

      {/* --back to marketplace button-- */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/">
          <button>Back to Marketplace</button>
        </Link>
      </div>

      {products.length === 0 && (
        <p>You have not purchased any products yet.</p>
      )}

      {products.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p>ID: {p.id}</p>
          <p>Price: {ethers.formatEther(p.price)} ETH</p>
          <p>Seller: {p.seller}</p>
          <p>Status: Access granted</p>

          {/* Placeholder for future content */}
          <button disabled>View Content</button>
        </div>
      ))}
    </div>
  );
}
