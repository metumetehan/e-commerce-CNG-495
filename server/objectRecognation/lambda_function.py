import json
import urllib.parse
import boto3

s3 = boto3.client('s3')
db = boto3.client('dynamodb')

def lambda_handler(event, context):

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    try:
        response = s3.get_object(Bucket=bucket, Key=key)

        """
        update_response = db.update_item(
            TableName= "item",
            Key={"item_ID": {
                "S": key
                }
            },
            ExpressionAttributeNames={
                '#C': 'category',
            },
            ExpressionAttributeValues={
                ':c': {
                    "S": "unknown",
                },
            },
            UpdateExpression='SET #C = :c',
            ReturnValues="UPDATED_NEW",
        )
        """
        print("CONTENT TYPE: " + response['ContentType'])
        return response['ContentType']
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e
              
