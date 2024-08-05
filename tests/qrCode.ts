import { Account, Ed25519PrivateKey, HexInput } from "@aptos-labs/ts-sdk";
import { aptos, createTransfer } from "../src/createTransfer";
import BigNumber from "bignumber.js";
import {
  buildStandaloneQRcodeURL,
  petraQRConnect,
  petraQRConnectDApp,
} from "../src/wallet/petra";
import { createQRCode } from "../src/buildQRcode";
import fs from "fs";
import * as dotenv from "dotenv";
import nacl from "tweetnacl";
dotenv.config();
// Function to create QR Code from a given data string
const createQRCodeFromCDN = async (data: any) => {
  const QRCode = require("qrcode"); // Assuming QRCode is already accessible or from a CDN

  return new Promise((resolve, reject) => {
    QRCode.toDataURL(data, (err: any, url: any) => {
      if (err) reject(err);
      resolve(url);
    });
  });
};

// Function to save the generated QR code to a file
const saveQRCode = (dataURL: any, filePath: any) => {
  const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(filePath, base64Data, "base64");
};
export const recipient = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(
    process.env.PRIVATE_KEYS_FOR_TESTING as HexInput,
  ),
});

describe("test generate QRCodes", () => {
  test("test qrcode normal", async () => {
    try {
      const payload = await createTransfer(aptos, {
        recipent: recipient.accountAddress,
        amount: new BigNumber(1),
      });
      const SECRET_KEY = nacl.randomBytes(nacl.secretbox.keyLength);
      const qrCodePayload = petraQRConnect(payload, SECRET_KEY);
      const qrCodeDataURL = await createQRCodeFromCDN(qrCodePayload.toString());

      const filePath = "qrcode.png";
      saveQRCode(qrCodeDataURL, filePath);
      console.log("QR code saved as:", filePath);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  });
  test("test qrcode normal", async () => {
    try {
      const payload = await createTransfer(aptos, {
        recipent: recipient.accountAddress,
        amount: new BigNumber(1),
      });
      const SECRET_KEY = nacl.randomBytes(nacl.secretbox.keyLength);
      const qrCodePayload = petraQRConnectDApp(SECRET_KEY, payload);
      console.log(qrCodePayload.toString()); // gives a big ass link appox 1100+ chars... ouch
      const qrCodeDataURL = await createQRCodeFromCDN(qrCodePayload.toString());

      const filePath = "qrcodeDAPP.png";
      saveQRCode(qrCodeDataURL, filePath);
      console.log("QR code saved as:", filePath);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  });
  test("test qrcode normal", async () => {
    try {

      const qrCodePayload = buildStandaloneQRcodeURL(
        recipient.accountAddress.toString(),
      );
      const qrCodeDataURL = await createQRCodeFromCDN(qrCodePayload.toString());

      const filePath = "qrcodeStandalone.png";
      saveQRCode(qrCodeDataURL, filePath);
      console.log("QR code saved as:", filePath);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  });
});
