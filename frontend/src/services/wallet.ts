import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Yêu cầu MetaMask kết nối và trả về signer
 * → DÙNG CHO WRITE (buyProduct)
 */
export async function getSigner() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }

  // yêu cầu user connect ví
  await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  return browserProvider.getSigner();
}

/**
 * Lấy address hiện tại từ MetaMask
 * → DÙNG CHO READ (hasAccess)
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
