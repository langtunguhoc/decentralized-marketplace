import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { marketplace } from "../services/marketplace";
import { createProduct, updateListing } from "../services/marketplaceWrite";
import { getCurrentAddress } from "../services/wallet";
import { ethers } from "ethers";

type Product = {
  seller: string;
  price: bigint;
  isActive: boolean;
  previewCid: string;
  metadataCid: string;
  contentType: string;
  soldCount: bigint;
};

export default function Dashboard() {
  const [products, setProducts] = useState<
    (Product & { id: number })[]
  >([]);

  const [price, setPrice] = useState("");
  const [previewCid, setPreviewCid] = useState("");
  const [metadataCid, setMetadataCid] = useState("");
  const [account, setAccount] = useState("");

  useEffect(() => {
    loadSellerProducts();
  }, []);

  async function loadSellerProducts() {
    const addr = (await getCurrentAddress()).toLowerCase();
    setAccount(addr);

    const nextId = await marketplace.nextProductId();
    const items: (Product & { id: number })[] = [];

    for (let i = 1; i <= Number(nextId); i++) {
      const raw = await marketplace.products(i);

      const p = {
        seller: raw[0],
        price: raw[1],
        isActive: raw[2],
        previewCid: raw[3],
        metadataCid: raw[4],
        contentType: raw[5],
        soldCount: raw[6],
      };

      if (p.seller.toLowerCase() === addr) {
        items.push({ ...p, id: i });
      }
    }

    setProducts(items);
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();

    await createProduct(
      price,
      previewCid,
      metadataCid,
      "image"
    );

    setPrice("");
    setPreviewCid("");
    setMetadataCid("");

    loadSellerProducts();
  }

  async function toggleActive(p: Product & { id: number }) {
    await updateListing(
      p.id,
      ethers.formatEther(p.price),
      p.previewCid,
      p.metadataCid,
      p.contentType,
      !p.isActive
    );

    loadSellerProducts();
  }

  return (
    <div>
      <h1>My Store</h1>
      <p>Connected: {account}</p>

      {/* --back to marketplace button-- */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/">
          <button>Back to Marketplace</button>
        </Link>
      </div>

      {/* CREATE PRODUCT */}
      <form onSubmit={handleCreateProduct}>
        <input
          placeholder="Price (ETH)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          placeholder="Preview CID"
          value={previewCid}
          onChange={(e) => setPreviewCid(e.target.value)}
        />
        <input
          placeholder="Metadata CID"
          value={metadataCid}
          onChange={(e) => setMetadataCid(e.target.value)}
        />
        <button type="submit">Create Product</button>
      </form>

      <hr />

      {/* LIST PRODUCT */}
      <h2>Your Products</h2>
      {products.length === 0 && <p>No products</p>}

      {products.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ccc",
            margin: 10,
            padding: 10,
          }}
        >
          <p>ID: {p.id}</p>
          <p>Price: {ethers.formatEther(p.price)} ETH</p>
          <p>Status: {p.isActive ? "Active" : "Inactive"}</p>
          <p>Sold: {Number(p.soldCount ?? 0)}</p>

          {<button onClick={() => toggleActive(p)}>
          {p.isActive ? "Deactivate" : "Activate"}
          </button>}
        </div>
      ))}
    </div>
  );
}
