import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3"
const S3 = new S3Client({});

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "item_table";

export const handler = async (event) => {
  let requestJSON = JSON.parse(event.body);
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };
  let error = 0;
  try {
    requestJSON.items.forEach(async (item) => {
      let data;
        if(error === 0) {
          data = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              item_ID: item.id,
            },
          })
        );
        data = data.Item;
        if(data.piece < item.piece) {
          body = 'The ${data.name} does not meet the quantity you selected';
        } 
      }
    });
    
    requestJSON.items.forEach(async (item) => {
        let data = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              item_ID: item.id,
            },
          })
        );
        data = data.Item;
        if(data.piece === item.piece) {
          await dynamo.send(
            new DeleteCommand({
              TableName: tableName,
              Key: {
                item_ID: item.id,
              },
            })
          );
        } else {
          await dynamo.send(
            new UpdateCommand({
              TableName: tableName,
              Key: {"item_ID": {
                  "S": item.id
                  }
              },
              ExpressionAttributeNames: {
                  '#P': 'piece',
              },
              ExpressionAttributeValues: {
                  ':p': data.piece - item.piece
              },
              UpdateExpression: 'SET #P = :p',
              ReturnValues: "UPDATED_NEW",
            })  
          );
        }
        
    });
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }
  return {
    statusCode,
    body,
    headers,
  };
};