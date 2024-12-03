export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { SendMailInterface } from "@/components/interface";
import { sendmail } from "@/components/Utils";
export async function POST(request: any) {
  try {
    const { to, cc, bcc, subject, html } = JSON.parse(
      request.headers.get("x-modified-source")
    );
    const message: SendMailInterface = { to, cc, bcc, subject, html };
    const response = await sendmail(message);
    return NextResponse.json(JSON.stringify(response), { status: 200 });
  } catch (err: any) {
    return NextResponse.json(JSON.stringify(err.message), { status: 500 });
  }
}
