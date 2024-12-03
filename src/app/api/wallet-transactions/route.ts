export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/Database/pooldb";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const pageSize = searchParams.get("pageSize") ?? "10";
    const pageIndex = searchParams.get("pageIndex") ?? "0";
    const offset = parseInt(pageIndex) * parseInt(pageSize);

    let query = `SELECT "UserId", "TDate", "TAmount", "TType", "TPurpose" FROM wallet WHERE "UserId" = '${userId}'`;
    
    if (startDate) {
      query += ` AND "TDate" >='${startDate}'`;
    }

    if (endDate) {
      query += ` AND "TDate" <= '${endDate}'`;
    }

    // Order by TDate in descending order and apply limit and offset
    query += ` ORDER BY "TDate" DESC LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

    try {
      const result = await client.query(query);
      return NextResponse.json(result.rows, { status: 200 });
    } catch (err: any) {
      console.error("Error executing query", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Error handling request", err);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const userId = request.headers.get("x-user-id");
    const { TAmount, TType, TPurpose } = JSON.parse(
      request.headers.get("x-modified-source")!
    );

    // Validate request data
    if (!userId || !TAmount || !TType || !TPurpose) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      const result = await client.query(
        `INSERT INTO wallet ("UserId", "WalletId", "TDate", "TAmount", "TType", "TPurpose", "LastUpdatedOn") VALUES ('${userId}', '${uuidv4()}', '${new Date().toISOString()}', ${TAmount}, '${TType}', '${TPurpose}', '${new Date().toISOString()}') RETURNING *`
      );

      const newTransaction = result.rows[0];
      return NextResponse.json(newTransaction, { status: 201 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  } finally {
    client.release();
  }
}
