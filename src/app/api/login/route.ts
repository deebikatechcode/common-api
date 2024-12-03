export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { GetCommand, EditCommand } from "@/Database/DynamoClient";
export async function POST(request: any) {
  try {
    const { Email, Password } = JSON.parse(
      request.headers.get("x-modified-source")
    );
    if (!Email || !Password) {
      return NextResponse.json("Email and Password is required", {
        status: 403,
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
        "No active account is available for this email",
        {
          status: 401,
        }
      );
    }
    if (data.Items[0].Confirmed == 0) {
      return NextResponse.json("Account is not yet activated", {
        status: 401,
      });
    }
    const isMatch = await bcrypt.compare(Password, data.Items[0].Password);
    if (!isMatch) {
      return NextResponse.json("Invalid Email or password", {
        status: 401,
      });
    }
    const status = await EditCommand({
      TableName: "Users",
      Key: {
        Email: Email,
      },
      UpdateExpression: "set #lastDate = :v_lastDate",
      ExpressionAttributeNames: {
        "#lastDate": "LastUpdatedOn",
      },
      ExpressionAttributeValues: {
        ":v_lastDate": new Date().toISOString(),
      },
    });

    if (status) {
      return NextResponse.json(
        jwt.sign(
          { userId: data.Items[0].UserId, email: data.Items[0].Email },
          process.env.JWT_SECRET_KEY!,
          { expiresIn: "1h" }
        ),
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json("Database is down", {
        status: 500,
      });
    }
  } catch (err: any) {
    return NextResponse.json(JSON.stringify(err.Message), {
      status: 500,
    });
  }
}
