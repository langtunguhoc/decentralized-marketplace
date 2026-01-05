import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { 
  encryptFile as litEncryptFile, 
  decryptToUint8Array as litDecryptToUint8Array 
} from "@lit-protocol/encryption";
import { LIT_ABILITY } from "@lit-protocol/constants";
import {
  LitAccessControlConditionResource,
} from "@lit-protocol/auth-helpers";
import { checkAndSignAuthMessage } from "@lit-protocol/auth-browser";

// 1. Initialize Client (Singleton)
// We use 'datil-test' for stability. 
// checkNodeAttestation: false prevents some testnet validation errors.
const client = new LitNodeClient({
  litNetwork: "datil-dev", 
  debug: false,
  checkNodeAttestation: false, 
});

// 2. Connection Helper
const connectLit = async () => {
  if (!client.ready) {
    try {
      await client.connect();
      console.log("🔥 Lit Protocol Connected (datil-test)");
    } catch (error) {
      console.error("Lit connection error:", error);
    }
  }
};

// 3. Access Control Logic
const getAccessConditions = (chain: string, contractAddress: string, productId: number) => {
  return [
    {
      conditionType: "evmContract",
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
        key: "",
        comparator: "=",
        value: "true",
      },
    },
  ];
};

// 4. Helper: Convert Blob to Base64 (Required for Decryption)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.replace(/^data:.+;base64,/, '');
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * ENCRYPT FILE
 */
export const encryptFile = async (
  file: File, 
  chain: string, 
  accessPassAddress: string, 
  productId: number
) => {
  await connectLit();

  const unifiedAccessControlConditions = getAccessConditions(chain, accessPassAddress, productId);

  // FIX: Simplified Session Sigs (Removes explicit resource to fix 'atob' error)
  const sessionSigs = await client.getSessionSigs({
    chain,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*') as any,
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async (params) => {
        const authSig = await checkAndSignAuthMessage({
            chain,
            expiration: params.expiration,
            uri: params.uri,
            resourceAbilityRequests: params.resourceAbilityRequests,
            nonce: params.nonce, 
        });
        return authSig;
    },
  });

  const { ciphertext, dataToEncryptHash } = await litEncryptFile(
    {
      file,
      unifiedAccessControlConditions,
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
 * DECRYPT FILE
 */
export const decryptFile = async (
  encryptedFileBlob: Blob, 
  encryptedKey: string,
  chain: string,
  accessPassAddress: string,
  productId: number,
  mimeType: string // <--- NEW PARAM: Required to render PDF correctly
): Promise<Blob> => {
  await connectLit();

  const unifiedAccessControlConditions = getAccessConditions(chain, accessPassAddress, productId);

  // 1. Convert Blob to Base64 String
  const ciphertext = await blobToBase64(encryptedFileBlob);

  // 2. Get Session Sigs (Simplified to fix crashes)
  const sessionSigs = await client.getSessionSigs({
    chain,
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*') as any,
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async (params) => {
        const authSig = await checkAndSignAuthMessage({
            chain,
            expiration: params.expiration,
            uri: params.uri,
            resourceAbilityRequests: params.resourceAbilityRequests,
            nonce: params.nonce, 
        });
        return authSig;
    },
  });

  // 3. Decrypt
  const decryptedUint8Array = await litDecryptToUint8Array(
    {
      ciphertext,
      dataToEncryptHash: encryptedKey,
      unifiedAccessControlConditions,
      chain,
      sessionSigs,
    },
    client
  );

  // 4. Return as Blob WITH MIME TYPE
  // This fixes the issue where PDF shows as plain text
  return new Blob([decryptedUint8Array as any], { type: mimeType });
};