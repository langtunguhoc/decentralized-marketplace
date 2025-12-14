import { useState, useEffect } from "react";
import { ethers } from "ethers";
import UploadProduct from "./UploadProduct";
import ProductList from "./ProductList";
import MarketplaceAbi from "./abi/Marketplace.json";
import contractAddress from "./abi/contract-address.json";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());

      // Connect to the Marketplace Contract
      const market = new ethers.Contract(
        contractAddress.marketplace,
        MarketplaceAbi.abi,
        signer
      );
      setContract(market);
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🛒 Decentralized Digital Store</h1>
      
      {!account ? (
        <button onClick={connectWallet} style={{ padding: "10px 20px", fontSize: "16px" }}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ marginBottom: "20px" }}>
          <p>👤 <strong>Connected:</strong> {account}</p>
        </div>
      )}

      <hr style={{ margin: "20px 0" }} />
      
      {/* SELLER SECTION */}
      <div style={{ marginBottom: "40px" }}>
        <h2>📤 Seller Zone (Upload)</h2>
        {contract ? <UploadProduct contract={contract} /> : <p>Please connect wallet to list items.</p>}
      </div>

      <hr style={{ margin: "20px 0" }} />

      {/* BUYER SECTION */}
      <div>
        <h2>🛍️ Buyer Zone (Marketplace)</h2>
        {contract ? <ProductList contract={contract} account={account} /> : <p>Connect wallet to view items.</p>}
      </div>
    </div>
  );
}

export default App;