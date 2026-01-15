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

  /* 1. Log để kiểm tra đầu vào trước khi gửi */
  console.log("--- DEBUG BUY ---");
  console.log("Product ID:", productId);
  console.log("Price (Wei String):", priceWei);
  
  // FIX 1: ÉP KIỂU GIÁ THÀNH BigInt
  let value: bigint;
  try {
      value = BigInt(priceWei);
      console.log("Value (BigInt):", value.toString());
  } catch (e) {
      throw new Error("Lỗi format giá tiền (priceWei không hợp lệ)");
  }

  // FIX 2: CHECK BALANCE
  const provider = signer.provider;
  if (!provider) throw new Error("Provider not found");

  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  if (balance < value) {
    throw new Error(`Số dư không đủ! Bạn có: ${ethers.formatEther(balance)} ETH, Cần: ${ethers.formatEther(value)} ETH`);
  }

  const marketplace = new ethers.Contract(
    CONTRACTS.amoy.Marketplace,
    MarketplaceABI.abi,
    signer
  );

  /* 3. THÊM LOGIC CHẶN TỰ MUA (Optional - nhưng nên có để đỡ tốn gas) */
  // Lưu ý: Đoạn này tốn thêm 1 call mạng, nếu mạng lag có thể bỏ qua
  /*
  const product = await marketplace.products(productId);
  if (product.seller.toLowerCase() === address.toLowerCase()) {
      throw new Error("Bạn không thể tự mua sản phẩm của chính mình!");
  }
  */

  try {
      /* FIX 3: Gửi Transaction */
      console.log("Đang gửi transaction...");
      const tx = await marketplace.buyProduct(productId, {
        value, 
        gasLimit: 5000000 // Đã set cứng gas -> Rất tốt
      });
      
      console.log("Tx Hash:", tx.hash);
      return tx.wait();

  } catch (error: any) {
      // 4. Bắt lỗi Revert từ Smart Contract để hiển thị rõ hơn
      console.error("Lỗi Blockchain chi tiết:", error);
      
      // Nếu lỗi chứa lý do từ Contract (ví dụ: "Seller cannot buy")
      if (error.reason) {
          throw new Error(`Lỗi Contract: ${error.reason}`);
      }
      // Nếu lỗi do User từ chối ký
      if (error.code === 'ACTION_REJECTED') {
          throw new Error("Bạn đã từ chối giao dịch.");
      }
      
      throw error;
  }
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
