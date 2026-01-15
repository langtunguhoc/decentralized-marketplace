import { ethers } from "ethers";
import MarketplaceABI from "../abis/Marketplace.json";
import { CONTRACTS } from "../config/contracts";
import { getSigner } from "./wallet";

/* ========= BUY (BUYER) ========= */
export async function buyProduct(
  productId: number,
  priceWei: string
) {
  const signer = await getSigner();

  /* FIX 1: ÉP KIỂU GIÁ THÀNH BigInt (BẮT BUỘC VỚI ETHERS v6) */
  const value = BigInt(priceWei);

  /* FIX 2: CHECK BALANCE TRƯỚC (TRÁNH METAMASK POPUP VÔ NGHĨA) */
  const provider = signer.provider;
  if (!provider) {
    throw new Error("Provider not found");
  }

  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  if (balance < value) {
    const error = new Error("Insufficient balance");
    (error as any).code = "INSUFFICIENT_FUNDS";
    throw error;
  }

  const marketplace = new ethers.Contract(
    CONTRACTS.amoy.Marketplace,
    MarketplaceABI.abi,
    signer
  );

  /* FIX 3: TRUYỀN value LÀ BigInt, KHÔNG PHẢI STRING */
  const tx = await marketplace.buyProduct(productId, {
    value, // 👈 QUAN TRỌNG
    gasLimit: 300_000
  });

  return tx.wait();
}

/* ========= SELLER ========= */

/** Create product */
export async function createProduct(
  priceEth: string,
  previewCid: string,
  productCid: string,
  encryptedKey: string,
  contentType: string
) {
  const signer = await getSigner();

  const marketplace = new ethers.Contract(
    CONTRACTS.amoy.Marketplace,
    MarketplaceABI.abi,
    signer
  );

  const tx = await marketplace.listProduct(
    ethers.parseEther(priceEth), // OK – ethers v6 trả bigint
    previewCid,
    productCid,
    encryptedKey,
    contentType
  );

  return tx.wait();
}

/** Update product (price + active) */
export async function updateListing(
  productId: number,
  priceEth: string,
  previewCid: string,
  productCid: string,
  encryptedKey: string,
  contentType: string,
  isActive: boolean
) {
  const signer = await getSigner();

  const marketplace = new ethers.Contract(
    CONTRACTS.amoy.Marketplace,
    MarketplaceABI.abi,
    signer
  );

  const tx = await marketplace.updateListing(
    productId,
    ethers.parseEther(priceEth),
    previewCid,
    productCid,
    encryptedKey,
    contentType,
    isActive
  );

  return tx.wait();
}
