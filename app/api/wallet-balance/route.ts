export const maxDuration = 60; // This function can run for a maximum of 60 seconds
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { pool } from "@/Database/pooldb";

export async function GET(request: any) {
  const client = await pool.connect();
  const userId = request.headers.get("x-user-id");
  console.log(userId);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const creditResult = await client.query(
      `SELECT COALESCE(SUM("TAmount"), 0) AS total_credit FROM wallet WHERE "UserId" = '${userId}' AND "TType" = 'Credit'`
    );
    const debitResult = await client.query(
      `SELECT COALESCE(SUM("TAmount"), 0) AS total_debit FROM wallet WHERE "UserId" ='${userId}' AND "TType" = 'Debit'`
    );
    const totalCredit = parseFloat(creditResult.rows[0].total_credit);
    const totalDebit = parseFloat(debitResult.rows[0].total_debit);
    const balance = totalCredit - totalDebit;

    return NextResponse.json({ balance }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(err.message, { status: 500 });
  } finally {
    client.release();
  }
}
