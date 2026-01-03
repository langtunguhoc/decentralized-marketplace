import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import ProductDetail from "./pages/ProductPreview";
import Dashboard from "./pages/MyStore";
import MyPurchases from "./pages/MyLibrary";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    if (!window.ethereum) {
      setConnected(false);
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    setConnected(accounts.length > 0);
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not found");
      return;
    }

    await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Sau khi connect → reload để load đúng role
    window.location.reload();
  }

  // Chưa check xong
  if (connected === null) {
    return <p>Loading...</p>;
  }

  // Chưa connect ví
  if (!connected) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Please connect to MetaMask</h2>
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
    );
  }

  // Đã connect ví → load app bình thường
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-products" element={<MyPurchases />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;