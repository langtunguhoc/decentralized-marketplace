import { ethers } from "ethers";
import MarketplaceABI from "../abis/Marketplace.json";
import { CONTRACTS } from "../config/contracts";
import { getSigner } from "./wallet";

/* ========= BUY (BUYER) ========= */
export async function buyProduct(productId: number, priceWei: string) {
  const signer = await getSigner();

  const marketplace = new ethers.Contract(
    CONTRACTS.amoy.Marketplace,
    MarketplaceABI.abi,
    signer
  );

  const tx = await marketplace.buyProduct(productId, {
    value: priceWei,
  });

  return tx.wait();
}

/* ========= SELLER ========= */

/** Create product */
export async function createProduct(
  priceEth: string,
  previewCid: string,
  metadataCid: string,
  contentType: string
) {
  const signer = await getSigner();

  const marketplace = new ethers.Contract(
    CONTRACTS.amoy.Marketplace,
    MarketplaceABI.abi,
    signer
  );

  const tx = await marketplace.listProduct(
    ethers.parseEther(priceEth),
    previewCid,
    metadataCid,
    contentType
  );

  return tx.wait();
}

/** Update product (price + active) */
export async function updateListing(
  productId: number,
  priceEth: string,
  previewCid: string,
  metadataCid: string,
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
    metadataCid,
    contentType,
    isActive
  );

  return tx.wait();
}
