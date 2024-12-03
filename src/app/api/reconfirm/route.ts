export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { EditCommand, GetCommand } from "@/Database/DynamoClient";
import { v4 as uuidv4 } from "uuid";
import { SendMailInterface } from "@/components/interface";
import { sendmail } from "@/components/Utils";
export async function GET(request: any) {
  try {
    const { searchParams } = request.nextUrl;
    const Email = searchParams.get("Email");
    const data = await GetCommand({
      TableName: "Users",
      KeyConditionExpression: "Email = :emailValue",
      ExpressionAttributeValues: {
        ":emailValue": Email,
      },
    });
    if (!data.Items || data.Items.length === 0) {
      return NextResponse.json(
        "No active account is available for this Email",
        {
          status: 403,
        }
      );
    }
    const ConfirmStr = uuidv4();

    const status = await EditCommand({
      TableName: "Users",
      Key: {
        Email: Email,
      },
      UpdateExpression:
        "set #confirmed = :v_confirmed, #lastDate = :v_lastDate",
      ExpressionAttributeNames: {
        "#confirmed": "ConfirmStr",
        "#lastDate": "LastUpdatedOn",
      },
      ExpressionAttributeValues: {
        ":v_confirmed": ConfirmStr,
        ":v_lastDate": new Date().toISOString(),
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
          messsage: "Regenerated confirm string",
        }),
        { status: 200 }
      );
    } else {
      return NextResponse.json(JSON.stringify(status), { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json(JSON.stringify(err.message), { status: 500 });
  }
}
