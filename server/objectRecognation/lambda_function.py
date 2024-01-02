import json
import urllib.parse
import boto3

s3 = boto3.client('s3',region_name='eu-central-1')
db = boto3.client('dynamodb',region_name='eu-central-1')
rk = boto3.client('rekognition',region_name='eu-central-1')

def lambda_handler(event, context):

    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    print(bucket,key);
    try:
        result = rk.detect_labels(
        Image={'S3Object':{'Bucket':bucket,'Name': key},},
         MaxLabels=1,
         Features=[
        'GENERAL_LABELS',
        ],
         
         )
        print(result)
        
        
        update_response = db.update_item(
            TableName= "item_table",
            Key={"item_ID": {
                "S": key
                }
            },
            ExpressionAttributeNames={
                '#C': 'category',
            },
            ExpressionAttributeValues={
                ':c': {
                    "S": result["Labels"][0]["Categories"][0]["Name"],
                },
            },
            UpdateExpression='SET #C = :c',
            ReturnValues="UPDATED_NEW",
        )
        
        
        return "Success"
    except Exception as e:
        print(e)
        print('Error getting object {} from bucket {}. Make sure they exist and your bucket is in the same region as this function.'.format(key, bucket))
        raise e
              
