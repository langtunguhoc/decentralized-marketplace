import { ethers } from "ethers";
import MarketplaceABI from "../abis/Marketplace.json";
import { CONTRACTS } from "../config/contracts";
import { getSigner } from "./wallet";

/* ========= BUY (BUYER) ========= */
export async function buyProduct(
  productId: number,
  priceWei: string,
  maxRetries: number = 3
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

  /* FIX 3: RETRY LOGIC CHO RACE CONDITION */
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 BUY ATTEMPT #${attempt}/${maxRetries}`);

      /* TĂNG GAS LIMIT LÊN 500K (từ 300K) */
      const tx = await marketplace.buyProduct(productId, {
        value,
        gasLimit: 500_000
      });

      console.log(`✅ TX SENT (attempt ${attempt}): ${tx.hash}`);
      return tx.wait();

    } catch (err: any) {
      lastError = err;
      console.error(`❌ ATTEMPT #${attempt} FAILED:`, err.message);

      /* DECODE CONTRACT REVERT REASON */
      if (err.data) {
        try {
          const decoded = marketplace.interface.parseError(err.data);
          console.error(`📍 CONTRACT ERROR: ${decoded?.name || 'Unknown'}`);
        } catch (e) {
          console.error("Could not decode error");
        }
      }

      /* NẾU LỖI KHÔNG PHẢI RACE CONDITION, THROW NGAY */
      if (
        err.message?.includes("Wrong value") ||
        err.message?.includes("Seller cannot buy") ||
        err.code === "INSUFFICIENT_FUNDS" ||
        err.code === 4001
      ) {
        throw err;
      }

      /* NẾU ĐÃ HẾT LẦN RETRY, THROW */
      if (attempt === maxRetries) {
        throw lastError;
      }

      /* WAIT TRƯỚC KHI RETRY (exponential backoff) */
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ WAITING ${delayMs}ms BEFORE RETRY...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      /* FETCH LẠI FRESH PRICE TRƯỚC KHI RETRY */
      try {
        const freshProduct = await marketplace.products(productId);
        const freshPrice = freshProduct[1];
        console.log(`📊 FRESH PRICE: ${freshPrice.toString()} wei`);
        
        if (freshPrice.toString() !== priceWei) {
          const error = new Error(`Price changed: ${priceWei} → ${freshPrice.toString()}`);
          (error as any).code = "PRICE_CHANGED";
          throw error;
        }
      } catch (e) {
        console.error("Error fetching fresh price:", e);
      }
    }
  }

  throw lastError || new Error("Buy failed after retries");
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
    contentType,
    { gasLimit: 500000 }
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
    isActive,
    { gasLimit: 500000 }
  );

  return tx.wait();
}
