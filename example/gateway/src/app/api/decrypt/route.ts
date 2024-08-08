import { decryptSearchParams } from "move-pay-sdk";
import { NextRequest, NextResponse } from "next/server";

const SECRET = new Uint8Array([
    170, 102, 152, 184, 127, 234,  63,  71,
    104,   7, 116,  17, 183,  87,  55,  61,
    184,   8, 198, 148, 126, 130, 193, 164,
     55,  76,  77,  31, 113,  10, 249,  35
  ]);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { nonce, data } = await request.json();

    if (nonce && data) {
      const decryptedData = decryptSearchParams(nonce, data, SECRET);
      return NextResponse.json(decryptedData);
    }

    return NextResponse.json({error: new Error("Error")});
  } catch (error) {
    console.error('Decryption error:', error);
    return NextResponse.json({error: new Error("Error")});
  }
}
