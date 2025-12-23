import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptFile as litEncryptFile, decryptToUint8Array } from "@lit-protocol/encryption";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { LitAccessControlConditionResource, LitAbility, createSiweMessage } from "@lit-protocol/auth-helpers";
import { checkAndSignAuthMessage } from "@lit-protocol/auth-browser"; // For browser wallets

// 1. Initialize Client (Singleton)
const client = new LitNodeClient({
  litNetwork: "datil-dev", // Use 'datil-test' for stable testnet, 'datil-dev' for bleeding edge
  debug: false,
});

// 2. Connection Helper
const connectLit = async () => {
  if (!client.ready) {
    try {
      await client.connect();
      console.log("🔥 Lit Protocol Connected");
    } catch (error) {
      console.error("Lit connection error:", error);
    }
  }
};

/**
 * 3. Centralized Access Control Logic
 * Defines the rule: "User must return 'true' from AccessPass.hasAccess(user, productId)"
 */
const getAccessConditions = (chain, contractAddress, productId) => {
  return [
    {
      conditionType: "evmContract", // 👈 Critical for custom contract calls
      contractAddress: contractAddress,
      chain: chain,
      functionName: "hasAccess",
      functionParams: [":userAddress", productId.toString()],
      functionAbi: {
        name: "hasAccess",
        inputs: [
          { name: "user", type: "address" },
          { name: "productId", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      },
      returnValueTest: {
        key: "", // Function returns a bool directly, so key is empty
        comparator: "=",
        value: "true",
      },
    },
  ];
};

/**
 * 4. Encrypt File
 */
export const encryptFile = async (file, chain, accessPassAddress, productId) => {
  await connectLit();

  const unifiedAccessControlConditions = getAccessConditions(chain, accessPassAddress, productId);

  // Get Session Signatures (Standard Flow)
  const sessionSigs = await client.getSessionSigs({
    chain,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*'),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async (params) => {
        // This popup will appear if the user doesn't have a valid session
        const authSig = await checkAndSignAuthMessage({
            chain,
            expiration: params.expiration,
            uri: params.uri,
            resourceAbilityRequests: params.resourceAbilityRequests
        });
        return authSig;
    },
  });

  const { ciphertext, dataToEncryptHash } = await litEncryptFile(
    {
      file,
      unifiedAccessControlConditions, // 👈 Using the unified format
      chain,
      sessionSigs,
    },
    client
  );

  return {
    encryptedFileBlob: ciphertext,
    encryptedKey: dataToEncryptHash,
  };
};

/**
 * 5. Decrypt File
 */
export const decryptFile = async (encryptedBlob, encryptedKeyHash, chain, accessPassAddress, productId) => {
  await connectLit();

  const unifiedAccessControlConditions = getAccessConditions(chain, accessPassAddress, productId);

  // Convert Blob to Base64 String for Lit SDK
  const ciphertext = await blobToBase64(encryptedBlob);

  const sessionSigs = await client.getSessionSigs({
    chain,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*'),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async (params) => {
        return await checkAndSignAuthMessage({
            chain,
            expiration: params.expiration,
            uri: params.uri,
            resourceAbilityRequests: params.resourceAbilityRequests
        });
    },
  });

  const decryptedResult = await decryptToUint8Array(
    {
      ciphertext,
      dataToEncryptHash: encryptedKeyHash,
      unifiedAccessControlConditions, // 👈 Must match encryption exactly
      chain,
      sessionSigs,
    },
    client
  );

  return decryptedResult;
};

// Helper: Blob -> Base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.replace(/^data:.+;base64,/, ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};