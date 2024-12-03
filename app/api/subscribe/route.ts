export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PostCommand, GetCommand } from "@/Database/DynamoClient";
export async function GET(request: any) {
  try {
    const { searchParams } = request.nextUrl;
    const Email = searchParams.get("Email");
    const Provider = searchParams.get("Provider");
    const data = await GetCommand({
      TableName: "Subscribe",
      KeyConditionExpression: "Email = :emailValue",
      FilterExpression: "Provider = :provider",
      ExpressionAttributeValues: {
        ":emailValue": Email,
        ":provider": Provider,
      },
    });
    if (data.Items && data.Items.length > 0) {
      return NextResponse.json("You are already subscribed", {
        status: 409,
      });
    }

    const status = await PostCommand({
      TableName: "Subscribe",
      Item: {
        Email,
        Provider
      },
    });
    if (status) {
      return NextResponse.json("Thanks for subscribing!", { status: 200 });
    }
  } catch (err: any) {
    return NextResponse.json(JSON.stringify(err.message), { status: 500 });
  }
}
