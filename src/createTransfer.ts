import {
  AccountAddress,
  AccountAddressInput,
  Aptos,
  AptosConfig,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  MoveUint64Type,
  MoveUint8Type,
  MoveValue,
  Network,
} from "@aptos-labs/ts-sdk";
import { Amount, Recipient, Token } from "./types";
import BigNumber from "bignumber.js";
import {
  fixMetadata,
  isAccountPrimaryStoreFrozen,
  primaryStoreExists,
  resolveTokenAddress,
} from "./utils";

// All functions here corrospond to the PRE QR Code creation validation and payload builders
// ONLY RECIEVER'S INFO IS VALIDATED HERE
// The Payload is devoid of sender because sender's address is unknown at this point

export const DEPLOYER_ADDRESS =
  "0x88d48d52799ff8b98fd8bc4d685c38b824baa0cb0e01b052f63396848d155e6b";
const config = new AptosConfig({
  network: Network.TESTNET,
  // fullnode: "https://aptos.testnet.suzuka.movementlabs.xyz/v1",
  // faucet: "https://faucet.testnet.suzuka.movementlabs.xyz",
});
export const aptos = new Aptos(config);

export class CreateTransferError extends Error {
  name = "CreateTransferError";
}

export interface CreateTransferFields {
  recipent: Recipient;
  amount: Amount;
  token?: Token;
  tokenSymbol?: string;
}
export interface RawJsonPayload {
  data: InputGenerateTransactionPayloadData;
  options?: InputGenerateTransactionOptions;
  withFeePayer?: boolean;
  message?: string;
}

export async function createTransfer(
  client: Aptos,

  { recipent, amount, token, tokenSymbol }: CreateTransferFields,
  message?: string,
): Promise<RawJsonPayload> {
  const recipientInfo = await client.getAccountInfo({
    accountAddress: recipent,
  });
  if (!recipientInfo) throw new CreateTransferError("recipient not found");
  if (!token) {
    const payload: RawJsonPayload = {
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [recipent, amount.toNumber()],
      },
      message,
    };
    return payload;
  }
  const tokenMetadata: MoveValue[] = await resolveTokenAddress(
    token,
    client,
    tokenSymbol,
  );
  const payload: RawJsonPayload = {
    data: {
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [
        fixMetadata(tokenMetadata),
        recipent,
        amount.toNumber(),
      ],
    },
    withFeePayer: true,
    message,
  };

  return payload;
}

export async function createSystemInstruction(
  client: Aptos,
  recipent: AccountAddressInput,
  amount: BigNumber,
  message?: string,
): Promise<RawJsonPayload> {
  const recipientInfo = await client.getAccountInfo({
    accountAddress: recipent,
  });
  if (!recipientInfo) throw new CreateTransferError("recipient not found");
  if ((amount.decimalPlaces() ?? 0) > 8)
    throw new CreateTransferError("amount decimals invalid");

  amount = amount.times(10 ** 8).integerValue(BigNumber.ROUND_FLOOR);

  const toks = amount.toNumber();

  const payload: RawJsonPayload = {
    data: {
      function: "0x1::coin::transfer",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [recipent, toks],
    },
    message,
  };

  // aptos doesnt support FAcoin transfer yet
  return payload;
}

export async function createCustomTokenInstruction(
  recipent: AccountAddressInput,
  amount: BigNumber,
  customToken: AccountAddressInput,
  client: Aptos,
  symbol?: string,
  message?: string,
): Promise<RawJsonPayload> {
  const recipientInfo = await client.getAccountInfo({
    accountAddress: recipent,
  });
  if (!recipientInfo) throw new CreateTransferError("recipient not found");
  const tokenMetadata: MoveValue[] = await resolveTokenAddress(
    customToken as AccountAddress,
    client,
    symbol,
  );
  const tokenMetadataAsAddress = fixMetadata(tokenMetadata);
  const supply = await client.view({
    payload: {
      function: "0x1::fungible_asset::supply",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [tokenMetadataAsAddress],
    },
  });

  const supplyNum = (supply[0] as any).vec;
  if (supplyNum.length === 0 && parseInt(supplyNum[0] as string) === 0){
    throw Error("Asset has no supply");
  }

  if ((amount.decimalPlaces() ?? 0) > parseInt(supply[0] as MoveUint64Type))
    throw new CreateTransferError("amount decimals invalid");

  const decimals = await client.view({
    payload: {
      function: "0x1::fungible_asset::decimals",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [tokenMetadataAsAddress],
    },
  });
  amount = amount
    .times(new BigNumber(10).pow(decimals[0] as MoveUint8Type))
    .integerValue(BigNumber.ROUND_FLOOR);

  if (!await primaryStoreExists(
    recipent as AccountAddress,
    tokenMetadataAsAddress,
    client,
  )){
    throw Error("Primary store doesnt exist for the token");
  }

  
  if(await isAccountPrimaryStoreFrozen(
    recipent as AccountAddress,
    tokenMetadataAsAddress,
    client,
  )){
    throw Error("Account is frozen");
  }
  const payload: RawJsonPayload = {
    data: {
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [
        fixMetadata(tokenMetadata),
        recipent,
        amount.toNumber(),
      ],
    },
    withFeePayer: true,
    message,
  };

  return payload;
}
