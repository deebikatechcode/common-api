
export const maxDuration = 60;
export const dynamic = "force-dynamic";
import Razorpay from 'razorpay';
import { ddbDocClient } from '@/Database/DynamoClient'; 
import { PutCommand } from '@aws-sdk/lib-dynamodb'; 
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
  
    const { amount, currency = 'INR', receipt = 'receipt_order_1' } = JSON.parse(request.headers.get('x-modified-source')!);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_ID!,
      key_secret: process.env.RAZORPAY_KEY!,
    });

    const options = {
      amount: amount * 100, 
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    const orderData = new PutCommand({
      TableName: "RazorpayOrders", 
      Item: {
        OrderId: order.id,        
        Amount: order.amount,     
        Currency: order.currency, 
        Receipt: order.receipt,   
        PaymentStatus: order.status,     
        CreatedAt: new Date().toISOString(), 
      },
    });

    await ddbDocClient.send(orderData);

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
