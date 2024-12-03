export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { EditCommand, GetCommand } from "@/Database/DynamoClient";
export async function GET(request: any) {
  try {
    const { searchParams } = request.nextUrl;
    const Email = searchParams.get("Email");
    const confirmedStr = searchParams.get("confirmedStr");
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
          status: 401,
        }
      );
    }
    if (data.Items[0].Confirmed == 1) {
      return NextResponse.json("Your account is already activated", {
        status: 200,
      });
    }
    if (data.Items[0].ConfirmStr == confirmedStr) {
      const status = await EditCommand({
        TableName: "Users",
        Key: {
          Email: Email,
        },
        UpdateExpression:
          "set #confirmed = :v_confirmed, #lastDate = :v_lastDate",
        ExpressionAttributeNames: {
          "#confirmed": "Confirmed",
          "#lastDate": "LastUpdatedOn",
        },
        ExpressionAttributeValues: {
          ":v_confirmed": 1,
          ":v_lastDate": new Date().toISOString(),
        },
      });
      if (status) {
        return NextResponse.json("Thanks for confirming!", { status: 200 });
      }
    } else {
      return NextResponse.json("Confirm string is not match with database", {
        status: 500,
      });
    }
  } catch (err: any) {
    return NextResponse.json(JSON.stringify(err.message), { status: 500 });
  }
}
