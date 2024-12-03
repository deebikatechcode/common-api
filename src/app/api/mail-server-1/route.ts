export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
export async function POST(request: any) {
  try {
    const { to, cc, bcc, subject, html } = JSON.parse(
      request.headers.get("x-modified-source")
    );
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      tls: {
        rejectUnauthorized: false,
      },
      secure: true,
      auth: {
        user: process.env.gmail_username,
        pass: process.env.gmail_password,
      },
    });

    const mailOptions = {
      from: process.env.gmail_username,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      html: html,
    };
    const response = await transporter.sendMail(mailOptions);
    return NextResponse.json(JSON.stringify(response), { status: 200 });
  } catch (err: any) {
    return NextResponse.json(JSON.stringify(err.message), { status: 200 });
  }
}
