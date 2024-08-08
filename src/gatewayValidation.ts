import {
  AccountAddress,
  AccountAddressInput,
  Aptos,
  MoveValue,
} from "@aptos-labs/ts-sdk";
import { CreateTransferError } from "./createTransfer";
import {
  fixMetadata,
  getAccountBalance,
  isAccountPrimaryStoreFrozen,
  primaryStoreExists,
} from "./utils";

export async function validateSystemInstruction(
  sender: string,
  client: Aptos,
  toks: number,
) {
  validateTransfer(sender, client);
  const senderBalance = await client.getAccountAPTAmount({
    accountAddress: sender,
  });
  if (toks > senderBalance) throw new CreateTransferError("insufficient funds");
}

export async function validateCustomTokenTransfer(
  sender: string,
  client: Aptos,
  tokenMetadata: MoveValue[],
  amount: bigint,
) {

  if (!(await primaryStoreExists(
    sender as AccountAddressInput as AccountAddress,
    fixMetadata(tokenMetadata),
    client,
  )) && (await isAccountPrimaryStoreFrozen(
    sender as AccountAddressInput as AccountAddress,
    fixMetadata(tokenMetadata),
    client,
  ))){
    throw Error("Primary Store doesnt Exist and/or Primary store is frozen");
  }
  const senderBalance = await getAccountBalance(
    sender as AccountAddressInput as AccountAddress,
    fixMetadata(tokenMetadata),
    client,
  );
  if (amount > senderBalance)
    throw new CreateTransferError("insufficient funds");
}

export async function validateTransfer(sender: string, client: Aptos) {
  const senderInfo = await client.getAccountInfo({
    accountAddress: sender as AccountAddressInput,
  });
  if (!senderInfo) throw new CreateTransferError("sender not found");
}
