export interface Product {
  id: number;
  seller: string;
  price: bigint;
  isActive: boolean;
  previewCid: string;
  productCid: string;
  contentType: string;
  encryptedKey: string
  soldCount: number;
}