export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { GetCommand, PostCommand } from "@/Database/DynamoClient";
import { sendmail } from "@/components/Utils";
import { SendMailInterface } from "@/components/interface";

export async function POST(request: any) {
  try {
    const { Email, Password } = JSON.parse(
      request.headers.get("x-modified-source")
    );
    if (!Email || !Password) {
      return NextResponse.json("Email and Password is required", {
        status: 422,
      });
    }
    const data = await GetCommand({
      TableName: "Users",
      KeyConditionExpression: "Email = :emailValue",
      ExpressionAttributeValues: {
        ":emailValue": Email,
      },
    });

    if (data && data.Items && data.Items.length > 0) {
      return NextResponse.json("This email address is already exists", {
        status: 403,
      });
    }
    const UserId = uuidv4();
    const ConfirmStr = uuidv4();
    const status = await PostCommand({
      TableName: "Users",
      Item: {
        UserId,
        Email,
        Password: await bcrypt.hash(Password, 10),
        Confirmed: 0,
        ConfirmStr,
        LastUpdatedOn: new Date().toISOString(),
      },
    });
    if (status) {
      const message: SendMailInterface = {
        to: Email,
        cc: "",
        bcc: "",
        subject: "Confirmation Text",
        html: `<p>${ConfirmStr}</p>`,
      };
      try {
        const response = await sendmail(message);
      } catch (err) {
        return NextResponse.json("Invaid Email", { status: 500 });
      }
      return NextResponse.json(
        JSON.stringify({
          messsage: "User Created Successfully",
        }),
        { status: 201 }
      );
    } else {
      return NextResponse.json("User Created failed", { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json(err.message, { status: 500 });
  }
}
