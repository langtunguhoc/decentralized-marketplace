import { ethers } from "ethers";
import AccessPassABI from "../abis/AccessPass.json";
import { provider } from "./provider";
import { CONTRACTS } from "../config/contracts";

export const accessPass = new ethers.Contract(
  CONTRACTS.amoy.AccessPass,
  AccessPassABI.abi,
  provider
);