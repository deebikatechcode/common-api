import { NextResponse } from "next/server";
export async function POST(request: any) {
  const data = await request.json();
  // create a random 96-bit initialization vector (IV)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // encode the text you want to encrypt
  const encodedPlaintext = new TextEncoder().encode(JSON.stringify(data));

  // prepare the secret key for encryption
  const secretKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(process.env.NEXT_PUBLIC_CIPHER_KEY!, "base64"),
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // encrypt the text with the secret key
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    secretKey,
    encodedPlaintext
  );
  return NextResponse.json(
    {
      ciphertext: Buffer.from(ciphertext).toString("base64"),
      iv: Buffer.from(iv).toString("base64"),
    },
    { status: 500 }
  );
}
