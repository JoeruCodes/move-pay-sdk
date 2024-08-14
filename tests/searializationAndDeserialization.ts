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
import nacl from "tweetnacl";
dotenv.config();
export const recipent = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(
    process.env.PRIVATE_KEYS_FOR_TESTING as HexInput,
  ),
});
describe("Serialization and Deserialization tests", () => {
  test("test serialization and deserialization tasks normal", async () => {
    const ret = await createTransfer(aptos, {
      recipent: recipent.accountAddress.toString(),
      amount: BigNumber(1),
    });
    const SECRET_KEY = nacl.randomBytes(nacl.secretbox.keyLength);
    const qrPayload = petraQRConnect(ret, SECRET_KEY).toString().slice("https://petra.app/explore?link=".length);
    console.log(qrPayload, SECRET_KEY);
    const decodedPayload = decryptURL(new URL(qrPayload), SECRET_KEY);
    expect(decodedPayload).toEqual({
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [recipent.accountAddress.toString(), "1"],
      },
    });
  });

  test("test serialization and deserialization tasks M2M DApp", async () => {
    const ret = await createTransfer(aptos, {
      recipent: recipent.accountAddress.toString(),
      amount: BigNumber(1),
    });
    const SECRET_KEY = nacl.randomBytes(nacl.secretbox.keyLength);
    const qrPayload = petraQRConnectDApp(SECRET_KEY, ret);
    const data = qrPayload.searchParams.get("data");
    if (data) {
      const linkerPayload: LinkerPayloadInterface = JSON.parse(atob(data));
      const linkerRedirectLink = linkerPayload.redirectLink;
      const decryptedURL = decryptURL(new URL(linkerRedirectLink), SECRET_KEY);
      
      expect(decryptedURL).toEqual({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [recipent.accountAddress.toString(), "1"],
        },
      });
    }
  });

  test("test some serialization arbitary", () => {
    const url  = new URL("https://movepay.com/?nonce=Eq9xbEPez811a%2FJSBTrbrFh%2BBEflrSvg&data=UgBzaBgAaBH9YqXOy%2Bq4GPfqnAKAxN1RenurC5KINNHx7mso%2Bk3JYO3oQThGyVJDifokPIlmvSYL3HXTLrQ1UpwwpTUXwCtoM2OuUIydYZuryzUj6%2F3XpB%2B8Iq3nkrxj6gKTxzWeTNG4386ss6TJfcQ1fBIga2OrIT7HlU%2Fc5Kocx4zhTZS7WbhpWw%2Fjb%2BlJjYiyRhfq2N%2B5mmeHh0ZaZdjFq%2BJ%2FGRji4iYl5vMtHgXG4oUG%2BTBUyN3bLQILy0NSAzkdl6dcB5P%2BIz6nKLTPmbrcyBQAfoy4KQzQujlkl2PBHKGwcfJTlEmAv6IGxBslUItD4xV4mtoehcjr%2B%2FDNXz8sr2g0wolqATLgD6DDILYhbCOitLPp4I7jmoM8K02y2kuEdgFVi79JVvuNwmYKYcukrVzkHA1pUZS9vba83O0JLMkP2AFDck9fNaX1Pxn7T69Vc0W%2Bg8%2BkyIDzjzYOAMm6O8o%2BEKrc4KFQHVc%2FKSvwo5DFZA9OdYRYtLhKpQo0UPgJpV77VJmyp96GyhtKtNkY");
    const secret = new Uint8Array([
      153, 188, 226, 107, 201,  48, 136,  60,
      249, 165,  91,  80,  45, 167, 118, 253,
       79, 204, 154, 124,  25,  54,  39,  90,
       14,  80,  21,  43, 197, 121,  61,  79
    ]);

    console.log(decryptURL(url, secret));
  })
});
