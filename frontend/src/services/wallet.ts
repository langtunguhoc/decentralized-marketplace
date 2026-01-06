 import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const AMOY_CHAIN_ID = "0x13882"; // 80002 in hex
const AMOY_CONFIG = {
  chainId: AMOY_CHAIN_ID,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

/**
 * Force MetaMask to switch to Polygon Amoy
 */
async function switchNetwork() {
  if (!window.ethereum) return;

  try {
    // Try to switch to Amoy
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: AMOY_CHAIN_ID }],
    });
  } catch (error: any) {
    // Error code 4902 means the chain has not been added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [AMOY_CONFIG],
        });
      } catch (addError) {
        console.error("User rejected adding the network:", addError);
        throw addError;
      }
    } else {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }
}

/**
 * Request MetaMask connection, FORCE network switch, and return signer
 * → USED FOR WRITE (buyProduct)
 */
export async function getSigner() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  // 1. Ensure user is connected
  await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  // 2. FORCE switch to Amoy before creating the signer
  await switchNetwork();

  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  return browserProvider.getSigner();
}

/**
 * Get current address
 * → USED FOR READ (hasAccess)
 */
export async function getCurrentAddress(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("No MetaMask account connected");
  }

  return accounts[0];
}