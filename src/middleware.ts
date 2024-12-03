import { NextResponse } from "next/server";
import * as jose from "jose";

export async function middleware(req: any) {
  const modifiedHeaders = new Headers(req.headers);
  // Check if the path is in skipArray to skip JWT token validation
  try {
    if (req.method == "OPTIONS") {
      return NextResponse.json("ok", { status: 200 });
    }
    const skipArray = [
      "/api/encrypt",
      "/api/mail-server-1",
      "/api/mail-server-2",
      "/api/login",
      "/api/signup",
      "/api/confirm",
      "/api/reconfirm",
      "/api/update-password",
    ];
    if (!skipArray.includes(req.nextUrl.pathname)) {
      try {
        const token = req.headers.get("Authorization");
        if (!token) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decodedUserId = (await jwtValidate(token)) as string;
        // Attach userId to request headers for further processing if needed
        modifiedHeaders.set("x-user-id", decodedUserId);
      } catch (err) {
        return NextResponse.json(
          JSON.stringify({ message: "JWT Validation Failed", err: err }),
          { status: 401 }
        );
      }
    }

    if (
      req.method != "GET" &&
      req.method != "DELETE" &&
      req.nextUrl.pathname != "/api/encrypt"
    ) {
      try {
        const originalBody = await req.json();
        const { iv, ciphertext } = originalBody; // Decrypt or modify the request body
        const decryptedSource = await decrypt(ciphertext, iv);

        modifiedHeaders.set("x-modified-source", decryptedSource);
      } catch (err) {
        return NextResponse.json(
          JSON.stringify({ message: "Decryption Failed", err: err }),
          { status: 401 }
        );
      }
    }

    return NextResponse.next({
      request: {
        headers: modifiedHeaders,
      },
    });
  } catch (err) {
    return NextResponse.json(JSON.stringify(err), { status: 500 });
  }
}

const jwtValidate = async (token: any) => {
  // Verify JWT token
  const jwtConfig = {
    secret: new TextEncoder().encode(process.env.JWT_SECRET_KEY),
  };
  const decoded = await jose.jwtVerify(token, jwtConfig.secret);
  return decoded.payload.userId;
};
const decrypt = async (ciphertext: string, iv: string) => {
  const key = process.env.NEXT_PUBLIC_CIPHER_KEY!;
  // prepare the secret key
  const secretKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(key, "base64"),
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // decrypt the encrypted text "ciphertext" with the secret key and IV
  const cleartext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: Buffer.from(iv, "base64"),
    },
    secretKey,
    Buffer.from(ciphertext, "base64")
  );

  // decode the text and return it
  return new TextDecoder().decode(cleartext);
};
