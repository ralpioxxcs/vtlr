import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.session import PartialCredentialsError
import logging

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

storage_host = os.getenv('STORAGE_HOST')
storage_port = os.getenv('STORAGE_PORT')
storage_bucket_name = os.getenv('STORAGE_BUCKET_NAME')
storage_access_key = os.getenv('STORAGE_ACCESS_KEY')
storage_secret_key = os.getenv('STORAGE_SECRET_KEY')


def get_s3_client():
  return boto3.client('s3',
                      endpoint_url=f'http://{storage_host}:{storage_port}',
                      aws_access_key_id=storage_access_key,
                      aws_secret_access_key=storage_secret_key,
                      use_ssl=False)


def upload_file_to_s3(file_name: str, bucket_name: str, object_name: str):
  s3_client = get_s3_client()
  if object_name is None:
    object_name = file_name

  try:
    s3_client.upload_file(file_name, bucket_name, object_name)
    logger.info(
        f"'{file_name}' has been uploaded to '{bucket_name}/{object_name}'.")
    return True
  except FileNotFoundError:
    logger.error(f"File '{file_name}' not found.")
    return False
  except (NoCredentialsError, PartialCredentialsError):
    logger.error("AWS credentials not found or are incomplete.")
    return False
  except Exception as e:
    logger.error(f"An unexpected error occurred during S3 upload: {e}")
    return False


def check_file_exist_s3(bucket_name: str, object_name: str):
  s3_client = get_s3_client()
  try:
    s3_client.head_object(Bucket=bucket_name, Key=object_name)
    logger.info(f"Object '{object_name}' exists in bucket '{bucket_name}'")
    return True
  except ClientError as e:
    if e.response['Error']['Code'] == '404':
      logger.info(
          f"Object '{object_name}' does not exist in bucket '{bucket_name}'")
      return False
    else:
      logger.error(f"A client error occurred: {e}")
      return False  # Assume non-existence on other errors
  except Exception as e:
    logger.error(f"An unexpected error occurred checking file existence: {e}")
    return False


def generate_presigned_url(bucket_name: str,
                           object_name: str,
                           expiration: int = 3600):
  """Generate a presigned URL to share an S3 object."""
  s3_client = get_s3_client()
  try:
    response = s3_client.generate_presigned_url('get_object',
                                                Params={
                                                    'Bucket': bucket_name,
                                                    'Key': object_name
                                                },
                                                ExpiresIn=expiration)
    logger.info(f"Generated presigned URL for {object_name}")
    return response
  except (NoCredentialsError, PartialCredentialsError):
    logger.error(
        "AWS credentials not found or are incomplete for presigned URL generation."
    )
    return None
  except ClientError as e:
    logger.error(
        f"A client error occurred during presigned URL generation: {e}")
    return None
  except Exception as e:
    logger.error(
        f"An unexpected error occurred during presigned URL generation: {e}")
    return None
