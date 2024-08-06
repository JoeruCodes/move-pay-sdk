import nacl from 'tweetnacl';
import { decryptURL, RawJsonPayload } from 'move-pay-sdk';
import { NextApiRequest, NextApiResponse } from 'next';
// const SECRET = new Uint8Array([
//   1, 129, 248,  57, 116,  31, 232, 237,
//   173, 122, 119,  46,   0,  48, 183,  65,
//   67, 179, 167,  99, 205, 184, 194,  85,
//   220, 203,  34, 255,  85,  34, 175, 161
// ]); // example secret


export async function POST(request: Request) {
    const json = await request.json();
    const url = new URL(json.url as string);
    const SECRET = new Uint8Array([
  1, 129, 248,  57, 116,  31, 232, 237,
  173, 122, 119,  46,   0,  48, 183,  65,
  67, 179, 167,  99, 205, 184, 194,  85,
  220, 203,  34, 255,  85,  34, 175, 161
]); // example secret
    const payload = decryptURL(url, SECRET);
    return Response.json(payload);
}