import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3"
const S3 = new S3Client({});

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "item_table";

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };
  
  try {
    const parsedBody = JSON.parse(event.body);
    const base64Image = parsedBody.file;
    const decodedImage = Buffer.from(base64Image,"base64");
    const command = new PutObjectCommand({
      bucket:"imagerekoknation",
      key: "test",
      body: decodedImage,
      ContentType: "image/jpeg"
    });
    const response = await client.send(command);
  } catch(err) {
    statusCode = 400;
      body = err.message;
    } finally {
      body = JSON.stringify(body);
    }

  try {
    switch (event.routeKey) {
      case "DELETE /items/{id}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              item_ID: event.pathParameters.id,
            },
          })
        );
        body = `Deleted item ${event.pathParameters.id}`;
        break;
      case "GET /items/{id}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              item_ID: event.pathParameters.id,
            },
          })
        );
        body = body.Item;
        break;
      case "GET /items":
        body = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        );
        body = body.Items;
        break;
      case "PUT /items":
        let requestJSON = JSON.parse(event.body);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              item_ID: requestJSON.item_ID,
              price: requestJSON.price,
              name: requestJSON.name,
              category: "unknown"
            },
          })
        );
        body = `Put item ${requestJSON.item_ID}`;
        break;
      case "GET /itemsbycategory/{category}":
        const data = await dynamo.send(
          new ScanCommand({
            TableName: tableName,
            ExpressionAttributeNames: {
                '#C': 'category',
            },
            ExpressionAttributeValues: {
              ':category': event.pathParameters.category,
            },
            FilterExpression: '#C = :category',
          })
        );
        body = data.Items;
        break;
      case "GET /itemcategorys":
        var items = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        );
        items = items.Items;
        const distinctValues = {};

        items.forEach(item => {
          // Assuming 'AttributeName' is a string attribute. Adjust the type accordingly.
          const attributeValue = item["category"];
          distinctValues[attributeValue] = true;
        });
        
        body = Object.keys(distinctValues);
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
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
