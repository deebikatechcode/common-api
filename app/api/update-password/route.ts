export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { GetCommand, EditCommand } from "@/Database/DynamoClient";

export async function POST(request: any) {
  try {
    const { Email, Password, confirmedStr } = JSON.parse(
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

    if (!data.Items || data.Items.length === 0) {
      return NextResponse.json(
        "No active account is available for this Email",
        {
          status: 403,
        }
      );
    }
    if (data.Items[0].ConfirmStr == confirmedStr) {
      const status = await EditCommand({
        TableName: "Users",
        Key: {
          Email: Email,
        },
        UpdateExpression:
          "set #password = :v_password, #lastDate = :v_lastDate",
        ExpressionAttributeNames: {
          "#password": "Password",
          "#lastDate": "LastUpdatedOn",
        },
        ExpressionAttributeValues: {
          ":v_password": await bcrypt.hash(Password, 10),
          ":v_lastDate": new Date().toISOString(),
        },
      });
      if (status) {
        return NextResponse.json(
          JSON.stringify({
            messsage: "Password Updated Successfully",
          }),
          { status: 201 }
        );
      } else {
        return NextResponse.json(
          JSON.stringify({ message: "Password Update failed", error: status }),
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        JSON.stringify({ message: "Confirm string is mismatch" }),
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(err.message, { status: 500 });
  }
}
