import os
import boto3
from botocore.exceptions import NoCredentialsError
from botocore.session import PartialCredentialsError

from dotenv import load_dotenv

load_dotenv()

storage_host=os.getenv('STORAGE_HOST')
storage_port=os.getenv('STORAGE_PORT')
storage_bucket_name=os.getenv('STORAGE_BUCKET_NAME')
storage_access_key=os.getenv('STORAGE_ACCESS_KEY')
storage_secret_key=os.getenv('STORAGE_SECRET_KEY')

def uploadFileToS3(file_name, bucket_name, object_name=None):
    s3_client = boto3.client('s3',
                             endpoint_url=f'http://{storage_host}:{storage_port}',
                             aws_access_key_id=storage_access_key,
                             aws_secret_access_key=storage_secret_key,
                             use_ssl=False)
    if object_name is None:
        object_name = file_name

    try:
        s3_client.upload_file(file_name, bucket_name, object_name)
        print(f"'{file_name}' has been uploaded to '{bucket_name}/{object_name}'.")
        return True
    except FileNotFoundError:
        print(f"File '{file_name}' not found.")
        return False
    except NoCredentialsError:
        print("AWS credentials not found.")
        return False
    except PartialCredentialsError:
        print("Incomplete AWS credentials.")
        return False
