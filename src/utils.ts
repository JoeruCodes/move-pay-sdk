import {
  AccountAddress,
  Aptos,
  GetFungibleAssetMetadataResponse,
  MoveFunctionId,
  MoveUint64Type,
  MoveValue,
} from "@aptos-labs/ts-sdk";
import { DEPLOYER_ADDRESS } from "./createTransfer";
import nacl from "tweetnacl";
import { decodeBase64, encodeBase64, encodeUTF8 } from "tweetnacl-util";

export async function getAccountBalance(
  account: AccountAddress,
  metadata: string,
  client: Aptos,
): Promise<number> {
  const ret = await client.view({
    payload: {
      function: "0x1::primary_fungible_store::balance",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [account, metadata],
    },
  });

  return parseInt((ret[0] as MoveUint64Type).toString());
}
export async function primaryStoreExists(
  owner: AccountAddress,
  metadata: string,
  client: Aptos,
): Promise<boolean> {
  const ret = await client.view({
    payload: {
      function: "0x1::primary_fungible_store::primary_store_exists",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [owner, metadata],
    },
  });

  return ret[0] as boolean;
}
export async function getAccountPrimaryStore(
  owner: AccountAddress,
  metadata: string,
  client: Aptos,
): Promise<AccountAddress> {
  const ret = await client.view({
    payload: {
      function: "0x1::primary_fungible_store::primary_store_address",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [owner, metadata],
    },
  });

  return AccountAddress.fromString(ret.toString());
}
export async function isAccountPrimaryStoreFrozen(
  account: AccountAddress,
  metadata: string,
  client: Aptos,
): Promise<boolean> {
  const ret = await client.view({
    payload: {
      function: "0x1::primary_fungible_store::is_frozen",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [account, metadata],
    },
  });

  return ret[0] as boolean;
}
export async function resolveTokenAddress(
  tokenAddress: AccountAddress,
  client: Aptos,
  tokenSymbol?: string,
): Promise<MoveValue[]> {
  const is_object = await client.view({
    payload: {
      function:
        `${DEPLOYER_ADDRESS}::deployer::object_exists` as MoveFunctionId,
      functionArguments: [tokenAddress],
    },
  });

  if (is_object[0] as boolean) {
    const ret = await client.view({
      payload: {
        function:
          `${DEPLOYER_ADDRESS}::deployer::get_metadata_from_asset_address` as MoveFunctionId,
        functionArguments: [tokenAddress],
      },
    });

    return ret;
  } else if (tokenSymbol) {
    const ret = await getTokenMetadata(tokenAddress, client, tokenSymbol);
    return ret;
  }

  throw new Error("Invalid token address");
}

// movement doesnt have a testnet indexer yet (docs) so cant test this function...
export async function resolveTokenAddressNew(
  tokenAddress: AccountAddress,
  client: Aptos,
  tokenSymbol?: string,
): Promise<GetFungibleAssetMetadataResponse> {
  try {
    const fungibleAssetMetdata =
      await client.fungibleAsset.getFungibleAssetMetadataByCreatorAddress({
        creatorAddress: tokenAddress,
      });
    return fungibleAssetMetdata;
  } catch (err) {
    if (tokenSymbol) {
      const fugibleAssetMetadata = await getTokenMetadata(
        tokenAddress,
        client,
        tokenSymbol,
      );
      return fugibleAssetMetadata as GetFungibleAssetMetadataResponse;
    } else {
      throw Error("need to provide the token symbol");
    }
  }
}
async function getTokenMetadata(
  ownerAddress: AccountAddress,
  client: Aptos,
  symbol: string,
): Promise<MoveValue[]> {
  const ret = await client.view({
    payload: {
      function: `${DEPLOYER_ADDRESS}::deployer::get_metadata` as MoveFunctionId,
      functionArguments: [ownerAddress, symbol],
    },
  });
  return ret;
}

export function encryptPayload(
  qrPayload: string,
  secretKey: Uint8Array,
  linkShortner?: Function,
) {
  // Generate a nonce (number used once) for encryption
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  // Encode the qrPayload as a Uint8Array
  const message = new TextEncoder().encode(qrPayload);
  // Encrypt the message using the secret key and nonce
  const encrypted = nacl.secretbox(message, nonce, secretKey);
  // Encode nonce and encrypted message to Base64 to easily transmit them
  return {
    nonce: encodeBase64(nonce),
    encrypted: encodeBase64(encrypted),
  };
}

export function decryptPayload(
  encryptedData: {
    nonce: string;
    encrypted: string;
  },
  secretKey: Uint8Array,
) {
  const nonce = decodeBase64(encryptedData.nonce);
  const encryptedMessage: Uint8Array = decodeBase64(encryptedData.encrypted);

  // Decrypt the message using the secret key and nonce
  const decryptedMessage = nacl.secretbox.open(
    encryptedMessage,
    nonce,
    secretKey,
  );

  if (!decryptedMessage) {
    throw new Error("Decryption failed");
  }

  // Decode the message from Uint8Array to a string
  return encodeUTF8(decryptedMessage);
}

export function fixMetadata(rawMetadata: MoveValue[]): string {
  return (rawMetadata[0] as any).inner;
}
