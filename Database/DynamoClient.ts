// Initialize the DynamoDB client
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  QueryCommand,
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
export const client = new DynamoDBClient({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});
export const ddbDocClient = DynamoDBDocumentClient.from(client);
export const GetCommand = async (object: any) => {
  return await DynamoDBDocumentClient.from(client).send(
    new QueryCommand(object)
  );
};

export const PostCommand = async (object: any) => {
  return await DynamoDBDocumentClient.from(client).send(new PutCommand(object));
};

export const EditCommand = async (object: any) => {
  return await DynamoDBDocumentClient.from(client).send(
    new UpdateCommand(object)
  );
};
