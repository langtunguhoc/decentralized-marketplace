import { ethers } from "ethers";
import MarketplaceABI from "../abis/Marketplace.json";
import { provider } from "./provider";
import { CONTRACTS } from "../config/contracts";

export const marketplace = new ethers.Contract(
  CONTRACTS.amoy.Marketplace,
  MarketplaceABI.abi,
  provider
);