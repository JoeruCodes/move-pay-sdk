import { AccountAddress, AccountAddressInput, Aptos } from "@aptos-labs/ts-sdk";
import { CreateTransferError} from "./createTransfer";
import { assert } from "console";
import { getAccountBalance, isAccountPrimaryStoreFrozen, primaryStoreExists } from "./utils";

export async function validateSystemInstruction(recipent: AccountAddress, sender: AccountAddress, client: Aptos, toks: number) {
    validateTransfer(sender, recipent, client);
    const senderBalance = await client.getAccountAPTAmount({
        accountAddress: sender
    });
    if (toks > senderBalance) throw new CreateTransferError('insufficient funds');
}

export async function validateCustomTokenTransfer(recipent: AccountAddress, sender: AccountAddress, client: Aptos, tokenMetadata: any, amount: bigint){
    assert(await primaryStoreExists(sender as AccountAddress, tokenMetadata, client) && await isAccountPrimaryStoreFrozen(sender as AccountAddress, tokenMetadata, client));
    const senderBalance = await getAccountBalance(sender as AccountAddress, tokenMetadata, client);
    if (amount > senderBalance) throw new CreateTransferError("insufficient funds");
}

export async function validateTransfer(sender: AccountAddress, recipent: AccountAddress, client: Aptos){
    const senderInfo = await client.getAccountInfo({accountAddress: sender as AccountAddressInput});
    if (!senderInfo) throw new CreateTransferError('sender not found');
    
    const recipientInfo = await client.getAccountInfo({accountAddress: recipent});
    if (!recipientInfo) throw new CreateTransferError('recipient not found');
}