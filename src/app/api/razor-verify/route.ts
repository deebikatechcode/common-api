import crypto from 'crypto';
import { EditCommand } from '@/Database/DynamoClient';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/Database/pooldb'; 
import uuid4 from "uuid4";

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature, amount } = JSON.parse(request.headers.get('x-modified-source')!);
    
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new Error('Missing UserId in headers');
    }

   
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY!)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ success: false, message: 'Invalid payment signature!' }, { status: 400 });
    }

    const updateParams = {
      TableName: 'RazorpayOrders',
      Key: { "OrderId": orderId },
      UpdateExpression: 'set PaymentStatus = :status',
      ExpressionAttributeValues: {
        ':status': 'paid',
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const dynamoResponse = await EditCommand(updateParams);
    if (!dynamoResponse || !dynamoResponse.Attributes || dynamoResponse.Attributes.PaymentStatus !== 'paid') {
      return NextResponse.json({ success: false, message: 'Failed to update payment status in DynamoDB' }, { status: 500 });
    }

    const last_updated_on = new Date().toISOString().slice(0, -1) + 'Z';
    const insertTransactionQuery = `
      INSERT INTO wallet ("UserId", "WalletId", "TDate", "TAmount", "TType", "TPurpose", "LastUpdatedOn")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [
      userId,
      uuid4(), 
      last_updated_on,
      amount,
      "Credit",
      "TopUp",
      last_updated_on,
    ];

    const postgresResponse = await pool.query(insertTransactionQuery, values);
   
    if (!postgresResponse || postgresResponse.rowCount !== 1) {
      return NextResponse.json({ success: false, message: 'Failed to record the transaction in PostgreSQL' }, { status: 500 });
    }

    
    return NextResponse.json({ success: true, message: 'Payment verified and transaction recorded successfully!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
