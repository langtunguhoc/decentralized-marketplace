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

  // --- 🛡️ SECURITY: Global Right-Click Ban ---
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault(); // Blocks the "Save As" menu
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);
  // ---------------------------------------------

  const connectWallet = async () => {
      if (window.ethereum) {
        try {
          // 1. Force Switch to Amoy
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }], // Hex for 80002
          });

          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setAccount(await signer.getAddress());

          // ... rest of your code
          const market = new ethers.Contract(
            contractAddress.marketplace,
            MarketplaceAbi.abi,
            signer
          );
          setContract(market);
        } catch (error) {
          // Error 4902 means the chain hasn't been added to MetaMask
          if (error.code === 4902) {
              alert("Please add Polygon Amoy Testnet to MetaMask!");
          } else {
              console.error(error);
          }
        }
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
      
      <div style={{ marginBottom: "40px" }}>
        <h2>📤 Seller Zone (Upload)</h2>
        {contract ? <UploadProduct contract={contract} /> : <p>Please connect wallet to list items.</p>}
      </div>

      <hr style={{ margin: "20px 0" }} />

      <div>
        <h2>🛍️ Buyer Zone (Marketplace)</h2>
        {contract ? <ProductList contract={contract} account={account} /> : <p>Connect wallet to view items.</p>}
      </div>
    </div>
  );
}

export default App;