import {
  Account,
  AccountAddress,
  AccountAddressInput,
  CreateAccountFromPrivateKeyArgs,
  Ed25519PrivateKey,
  HexInput,
  PrivateKey,
} from "@aptos-labs/ts-sdk";
import {
  aptos,
  createTransfer,
  DEPLOYER_ADDRESS,
} from "../src/createTransfer";
import BigNumber from "bignumber.js";
import { createPrivateKey } from "crypto";
import { fixMetadata, resolveTokenAddress } from "../src/utils";
import * as dotenv from "dotenv";
dotenv.config();
// const recipent = Account.fromPrivateKey({
//     privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEYS_FOR_TESTING as HexInput),
// });
export const recipent = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(
    process.env.PRIVATE_KEYS_FOR_TESTING as HexInput,
  ),
});

const createDummyToken = async () => {
  try {
    const txn = await aptos.transaction.build.simple({
      sender: recipent.accountAddress,
      data: {
        function: `${DEPLOYER_ADDRESS}::deployer::generate_asset`,
        functionArguments: [
          "SCOTOKEN",
          "SCO",
          8,
          69,
          "www.example.com",
          "www.example.com",
        ],
      },
    });
    const response = await aptos.signAndSubmitTransaction({
      signer: recipent,
      transaction: txn,
    });

    const exec = await aptos.waitForTransaction({
      transactionHash: response.hash,
    });
  } catch (err) {
    console.log("already created");
  }
};
describe("testing transaction builder", () => {
  test("test createTransfer", async () => {
    const amount = new BigNumber(1);

    const ret = await createTransfer(aptos, {
      recipent: recipent.accountAddress.toString(),
      amount: amount,
    });

    expect(ret).toEqual({
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [recipent.accountAddress.toString(), "100000000"],
      },
      message: undefined,
    });
  }, 10000);
  test("test createTransfer with custom token", async () => {
    const amount = new BigNumber(1);
    await createDummyToken();
    const tokenMetadata = await resolveTokenAddress(
      recipent.accountAddress as AccountAddress,
      aptos,
      "SCO",
    );

    const ret = await createTransfer(aptos, {
      recipent: recipent.accountAddress.toString(),
      amount: amount,
      token: recipent.accountAddress,
      tokenSymbol: "SCO",
    });
    expect(ret).toEqual({
      data: {
        function: "0x1::primary_fungible_store::transfer",
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [
          fixMetadata(tokenMetadata),
          recipent.accountAddress.toString(),
          "100000000",
        ],
      },
      withFeePayer: true,
      message: undefined,
    });
  }, 10000);

});
