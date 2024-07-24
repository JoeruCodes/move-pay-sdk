import { RawJsonPayload } from "../createTransfer";
import nacl from 'tweetnacl';
import {encryptPayload } from "../utils";
import { URLSearchParams } from "url";
import { deflate } from "zlib";
import { assert } from "console";

const PETRA_LINK_BASE = 'petra://api/v1';
const PETRA_EXPLORE_REDIRECT = 'https://petra.app/explore?link=';
const DAPP_URL = "https://movepay.com/";
const APP_INFO = {
  domain: 'https://movepay.com',
  name: 'movepay',
};

export const SECRET_KEY = nacl.randomBytes(nacl.secretbox.keyLength);

const APP_KEYPAIRS = {
    publicKey: new Uint8Array( [
      118, 68,  79,   3, 246, 166, 184, 234,
      151, 32,  67, 102,  78, 252,  42, 254,
       63, 82,  34, 195,  45,  92, 171, 120,
      184, 33, 234,  90, 174, 101, 144,  16
    ]),
    secretKey: new Uint8Array([
      123,  23, 220,  55, 147,  43, 116, 173,
       72, 229,  20, 121, 215,  18, 145, 226,
      158, 210,  48, 131,  96, 228,   4, 186,
       33, 127,   3,   4, 169,  88, 198,  66
    ])
};
// basically parses the transaction into a qrcode payload for Petra
export function petraQRConnect(transaction: RawJsonPayload): URL{
    const qrPayload = JSON.stringify(
        transaction
    );
    const encryptedPayloadJson = encryptPayload(qrPayload, SECRET_KEY);
    const ret = new URL(`${PETRA_EXPLORE_REDIRECT}${DAPP_URL}&nonce=${encodeURIComponent(encryptedPayloadJson.nonce)}&data=${encodeURIComponent(encryptedPayloadJson.encrypted)}`);
    assert(ret.toString().length <= 2000);
    return ret;
}

export interface LinkerPayloadInterface {
    appInfo: {
        domain: string,
        name: string
    };
    redirectLink: string;
    dappEncryptionPublicKey: string
}
// leave it blank for using movepay app...
export function petraQRConnectDApp(transaction: RawJsonPayload, dappURL?: string, DAPP_INFO?:{
    domain: string,
    name: string
}): URL{
    const qrPayload = JSON.stringify(
        transaction
    );
    const encryptedPayload = encryptPayload(qrPayload, SECRET_KEY);
    const data: LinkerPayloadInterface = {
        appInfo: DAPP_INFO? DAPP_INFO : APP_INFO,
        redirectLink: `${dappURL ? dappURL : DAPP_URL}?nonce=${encodeURIComponent(encryptedPayload.nonce)}&data=${encodeURIComponent(encryptedPayload.encrypted)}`,
        dappEncryptionPublicKey: Buffer.from(APP_KEYPAIRS.publicKey).toString('hex')
    }
    const ret = new URL(`${PETRA_LINK_BASE}/connect?data=${btoa(JSON.stringify(data))}`);
    assert(ret.toString().length <= 2000);
    return ret;
}

function getSharedEncryptionSecretKey(data: string, secretKey: Uint8Array = APP_KEYPAIRS.secretKey): Uint8Array {
    const { petraPublicencryptedKey } = JSON.parse(atob(data));
    console.log(petraPublicencryptedKey);

    const sharedEncryptionSecretKey = nacl.box.before(
        Buffer.from(petraPublicencryptedKey.slice(2), 'hex'),
        secretKey
    );
    
    return sharedEncryptionSecretKey;
}

function handleConnection(params: URLSearchParams): Uint8Array {
    const responseStatus = params.get('response');
    if (responseStatus === 'approved') {
        const data = params.get('data');
        if (!data) {
            throw new Error('Missing data from Petra response');
        }
        return getSharedEncryptionSecretKey(data);
    }
    
    throw new Error('Connection Refused');
}

export function parseResponseUrl(url: string): Uint8Array {
    const urlObject = new URL(url);
    const params = new URLSearchParams(urlObject.search);
    
    switch (urlObject.pathname) {
        case '/api/v1/connect':
            return handleConnection(params);
        default:
            throw new Error('Invalid path');
    }
}

export function signAndSumbitTransactionDapp(sharedPublicKey: Uint8Array, publicKey: Uint8Array, payload: RawJsonPayload, url: URL): string{
    const {functionArguments, ...other} = payload.data;
    const bytesPayload = btoa(JSON.stringify(
        {
            arguments: functionArguments,
            ...other
        }
    ));

    const nonce = nacl.randomBytes(24);

    const encryptedPayload = nacl.box.after(
        Buffer.from(JSON.stringify(bytesPayload)),
        nonce,
        sharedPublicKey
    );
    // Folder structure for expo dapps
    //  [qrCodeDataSlug]
    //      |-> base url redirects to response after connection request
    //      |---->  response
    const data = btoa(
        JSON.stringify({
          appInfo: APP_INFO,
          payload: Buffer.from(encryptedPayload).toString('hex'),
          redirectLink: `${url}/response`,
          dappEncryptionPublicKey: Buffer.from(publicKey).toString('hex'),
          nonce: Buffer.from(nonce).toString('hex'),
        }),
    );

    return `${PETRA_LINK_BASE}/signAndSubmit?data=${data}`;
}


// for standalone QRcodes containing only addresses
export function buildStandaloneQRcodeURL(address: string): string{
    return `https://petra.app/receive?address=${address}`;
}


