import { Account, AccountAddress, AccountAddressInput, CreateAccountFromPrivateKeyArgs, Ed25519PrivateKey, HexInput, PrivateKey } from "@aptos-labs/ts-sdk"
import { aptos, createCustomTokenInstruction, createSystemInstruction, createTransfer, DEPLOYER_ADDRESS } from "../src/createTransfer"
import BigNumber from "bignumber.js";
import { assert } from "console";
import { createPrivateKey } from "crypto";
import { resolveTokenAddress } from "../src/utils";
import * as dotenv from 'dotenv';
dotenv.config();
// const recipent = Account.fromPrivateKey({
//     privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEYS_FOR_TESTING as HexInput),
// });
export const recipent = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEYS_FOR_TESTING as HexInput),
});
describe('testing transaction builder', () => {
    test('test createTransfer', () => {

        const amount = new BigNumber(1);
        createTransfer(aptos, {
            recipent: recipent.accountAddress,
            amount: amount
        }).then((transferJSON) => {
            expect(transferJSON).toEqual({
                data:{
                    function: "0x1::coin::transfer",
                    typeArguments: ["0x1::aptos_coin::AptosCoin"],
                    functionArguments: [recipent.accountAddress, amount.toNumber()]
                }
            });
        });
    });
    test('test createTransfer with custom token', () => {
        const amount = new BigNumber(1);

        resolveTokenAddress(recipent.accountAddress as AccountAddress, aptos, "SCO").then((tokenMetadata) => {
            createTransfer(aptos, {
                recipent: recipent.accountAddress,
                amount: amount,
                token: recipent.accountAddress,
                tokenSymbol: "SCO"
            }).then((transferJSON) => {
                expect(transferJSON).toEqual({
                    data:{
                        function: "0x1::primary_fungible_store::transfer",
                        typeArguments: ["0x1::fungible_asset::Metadata"],
                        functionArguments: [tokenMetadata, recipent.accountAddress,  1],
                    },
                    withFeePayer: true
                });
            });
        });

    });

    test('test createSystemTransaction', () => {
        createSystemInstruction(recipent.accountAddress, BigNumber(1)).then((payload) => {
            expect(payload).toEqual({
                data:{
                    function: "0x1::coin::transfer",
                    typeArguments: ["0x1::aptos_coin::AptosCoin"],
                    functionArguments: [recipent.accountAddress, 10**8]
                }
            })
        })
    });

    test('test create custom token transfer function', () => {
        createCustomTokenInstruction(recipent.accountAddress, BigNumber(1), recipent.accountAddress, aptos, "SCO").then((payload) => {
            console.log(payload)
        })
    })
})