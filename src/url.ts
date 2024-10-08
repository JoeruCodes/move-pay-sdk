import { RawJsonPayload } from "./createTransfer";
import { decryptPayload } from "./utils";
import { AccountAddress, AccountAddressInput } from "@aptos-labs/ts-sdk";

export function decryptURL(url: URL, SECRET_KEY: Uint8Array): RawJsonPayload {
  const urlParams = new URL(url).searchParams;

  const nonce = urlParams.get("nonce");
  const encrypted = urlParams.get("data");
  if (nonce && encrypted) {
    return decryptSearchParams(nonce, encrypted, SECRET_KEY);
  }

  throw Error("Couldn't parse URL");
}

export function decryptSearchParams(nonce: string, data: string, SECRET_KEY: Uint8Array): RawJsonPayload{
  const encryptedData = {
    nonce: nonce,
    encrypted: data,
  };
  const decryptedPayload = decryptPayload(encryptedData, SECRET_KEY);

  const ret: RawJsonPayload = JSON.parse(decryptedPayload);
  const newArgs = [];
  for (const i of ret.data.functionArguments) {
    if (i !== null && typeof i === "object" && !Array.isArray(i)) {
      // Convert object with numeric keys back to Uint8Array
      const dataObject = (i as any).data;
      const uint8Array = new Uint8Array(
        Object.values(dataObject),
      ) as AccountAddressInput;
      const s = AccountAddress.from(uint8Array);
      newArgs.push(s);
    } else {
      newArgs.push(i);
    }
  }
  ret.data.functionArguments = newArgs;
  return ret;
}
