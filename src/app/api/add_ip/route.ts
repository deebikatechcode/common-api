export const maxDuration = 60;
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { ddbDocClient } from '@/Database/DynamoClient';

const TABLE_NAME = 'APICodes';

interface IPAddressAction {
  key: string;
  ipAddress?: string;
  route?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new Error('Missing UserId in headers');
    }

    const { key, ipAddress, route }: IPAddressAction = JSON.parse(request.headers.get('x-modified-source')!);

    if (!key) {
      return NextResponse.json({ message: 'API key is required' }, { status: 400 });
    }

    // Fetch the item by key
    const getItemCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { key: { S: key } },
    });
    const getItemResponse = await ddbDocClient.send(getItemCommand);

    if (!getItemResponse.Item) {
      return NextResponse.json({ message: 'API key not found' }, { status: 404 });
    }

    const item = getItemResponse.Item;
    const routes = new Set(item.Routes?.SS || []);
    const whitelist = new Set(item.WhiteList?.SS || []);

    // Add new route and/or IP address if provided
    if (route) {
      routes.add(route);
    }

    if (ipAddress) {
      whitelist.add(ipAddress);
    }

    // Prepare the UpdateExpression and ExpressionAttributeValues dynamically
    const updateExpressionParts = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (route) {
      updateExpressionParts.push('Routes = :routes');
      expressionAttributeValues[':routes'] = { SS: Array.from(routes) };
    }

    if (ipAddress) {
      updateExpressionParts.push('WhiteList = :whitelist');
      expressionAttributeValues[':whitelist'] = { SS: Array.from(whitelist) };
    }

    // Update or validate key based on the provided data
    if (updateExpressionParts.length > 0) {
      // Update the item with new routes or whitelist if any
      const updateItemCommand = new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { key: { S: key } },
        UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      const updateItemResponse = await ddbDocClient.send(updateItemCommand);

      if (updateItemResponse) {
        return NextResponse.json(
          { message: 'API key processed successfully with provided details' },
          { status: 200 }
        );
      } else {
        throw new Error('Failed to update the item');
      }
    } else {
      // Only API key is provided, validate its existence
      return NextResponse.json(
        { message: 'API key validated successfully' },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 }
    );
  }
}
