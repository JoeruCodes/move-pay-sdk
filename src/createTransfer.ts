import {AccountAddress, AccountAddressInput, Aptos, AptosConfig, InputGenerateTransactionOptions, InputGenerateTransactionPayloadData, MoveUint64Type, MoveUint8Type, Network } from "@aptos-labs/ts-sdk";
import { Amount, Recipient, Token } from "./types";
import BigNumber from "bignumber.js";
import { assert } from "console";
import { isAccountPrimaryStoreFrozen, primaryStoreExists, resolveTokenAddress } from "./utils";


// All functions here corrospond to the PRE QR Code creation validation and payload builders
// ONLY RECIEVER'S INFO IS VALIDATED HERE
// The Payload is devoid of sender because sender's address is unknown at this point



export const DEPLOYER_ADDRESS = "0x0ab5130d080b01ff4f06eb4e4edf467321f07c443f1c2e5e0f3456f4e97a9b1d";
const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://aptos.testnet.suzuka.movementlabs.xyz/v1",
    faucet: "https://faucet.testnet.suzuka.movementlabs.xyz",
});
export const aptos = new Aptos(config);

export class CreateTransferError extends Error{
    name = 'CreateTransferError'
};

export interface CreateTransferFields{
    recipent: Recipient;
    amount: Amount;
    token?: Token;
    tokenSymbol?: string;
}
export interface RawJsonPayload{
    data:InputGenerateTransactionPayloadData,
    options?: InputGenerateTransactionOptions;
    withFeePayer?: boolean;
}

export async function createTransfer(
    client: Aptos,

    {recipent, amount, token, tokenSymbol}: CreateTransferFields,
): Promise<RawJsonPayload>{

    if(!token){
        const payload: RawJsonPayload = {
            data:{
                function: "0x1::coin::transfer",
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [recipent, amount.toNumber()]
            }
        };
        return payload;
    }
    const tokenMetadata: any = await resolveTokenAddress(token, client, tokenSymbol);
    const payload: RawJsonPayload = {
        data:{
            function: "0x1::primary_fungible_store::transfer",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [tokenMetadata, recipent, amount.toNumber()],
        },
        withFeePayer: true
    };

    return payload;
}




export async function createSystemInstruction(recipent: AccountAddressInput, amount: BigNumber): Promise<RawJsonPayload> {
    if ((amount.decimalPlaces() ?? 0) > 8) throw new CreateTransferError('amount decimals invalid');
    
    amount = amount.times(10**8).integerValue(BigNumber.ROUND_FLOOR);

    const toks = amount.toNumber();

    const payload: RawJsonPayload = {
        data:{
            function: "0x1::coin::transfer",
            typeArguments: ["0x1::aptos_coin::AptosCoin"],
            functionArguments: [recipent, toks]
        }
    };

    // aptos doesnt support FAcoin transfer yet
    return payload;

}


export async function createCustomTokenInstruction(recipent: AccountAddressInput, amount: BigNumber, customToken: AccountAddressInput, client: Aptos, symbol?: string): Promise<RawJsonPayload>{
    const tokenMetadata: any = await resolveTokenAddress(customToken as AccountAddress, client, symbol);

    const supply= await client.view({
        payload: {
            function: "0x1::fungible_asset::supply",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [tokenMetadata]
        }
    });
    assert(supply[0] !== undefined || supply[0] !== null);

    if ((amount.decimalPlaces() ?? 0) > parseInt((supply[0] as MoveUint64Type))) throw new CreateTransferError('amount decimals invalid');

    const decimals = await client.view({
        payload: {
            function: "0x1::fungible_asset::decimals",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [tokenMetadata]
        }
    });
    amount = amount.times(new BigNumber(10).pow(decimals[0] as MoveUint8Type)).integerValue(BigNumber.ROUND_FLOOR);

    assert(
    await primaryStoreExists(recipent as AccountAddress, tokenMetadata, client)
    );

    assert(
        await isAccountPrimaryStoreFrozen(recipent as AccountAddress, tokenMetadata, client)
    );
    
    const payload: RawJsonPayload = {
        data:{
            function: "0x1::primary_fungible_store::transfer",
            typeArguments: ["0x1::fungible_asset::Metadata"],
            functionArguments: [tokenMetadata, recipent, amount.toNumber()],
        },
        withFeePayer: true
    };

    return payload;
}

