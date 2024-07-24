import { Account, Ed25519PrivateKey, HexInput } from "@aptos-labs/ts-sdk";
import { aptos, createTransfer } from "../src/createTransfer";
import BigNumber from "bignumber.js";
import {
  LinkerPayloadInterface,
  petraQRConnect,
  petraQRConnectDApp,
} from "../src/wallet/petra";
import { decryptURL } from "../src/url";
import * as dotenv from "dotenv";
dotenv.config();
export const recipent = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(
    process.env.PRIVATE_KEYS_FOR_TESTING as HexInput,
  ),
});
describe("Serialization and Deserialization tests", () => {
  test("test serialization and deserialization tasks normal", async () => {
    const ret = await createTransfer(aptos, {
      recipent: recipent.accountAddress,
      amount: BigNumber(1),
    });

    const qrPayload = petraQRConnect(ret);
    const decodedPayload = decryptURL(qrPayload);
    expect(decodedPayload).toEqual({
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [recipent.accountAddress, 1],
      },
    });
  });

  test("test serialization and deserialization tasks M2M DApp", async () => {
    const ret = await createTransfer(aptos, {
      recipent: recipent.accountAddress,
      amount: BigNumber(1),
    });
    const qrPayload = petraQRConnectDApp(ret);
    const data = qrPayload.searchParams.get("data");
    if (data) {
      const linkerPayload: LinkerPayloadInterface = JSON.parse(atob(data));
      const linkerRedirectLink = linkerPayload.redirectLink;
      const decryptedURL = decryptURL(new URL(linkerRedirectLink));
      expect(decryptedURL).toEqual({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [recipent.accountAddress, 1],
        },
      });
    }
  });
});
