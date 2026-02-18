import boto3
import time
import logging
from datetime import datetime, timedelta, timezone
from botocore.config import Config
from botocore.exceptions import ClientError
from decouple import config

# Setup Logging
logger = logging.getLogger(__name__)

# R2 Configuration from Environment
R2_ACCOUNT_ID = config('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = config('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = config('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = config('R2_BUCKET_NAME')

# Construct the endpoint URL if not provided explicitly
DEFAULT_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_ENDPOINT_URL = config('R2_ENDPOINT_URL', default=DEFAULT_ENDPOINT)

def get_r2_client():
    """
    Initializes and returns a Boto3 client configured for Cloudflare R2.
    Uses s3v4 signature and 'auto' region as required by Cloudflare.
    """
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def get_upload_presigned_url(ca_code, customer_id, financial_year, month, file_name):
    """
    Generates a presigned URL for a PUT request to upload a CSV file.
    Path: uploads/{ca_code}/{customer_id}/{fy}/{month}/{timestamp}_{file_name}
    """
    s3 = get_r2_client()
    timestamp = int(time.time())
    storage_key = f"uploads/{ca_code}/{customer_id}/{financial_year}/{month}/{timestamp}_{file_name}"
    
    try:
        presigned_url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': R2_BUCKET_NAME,
                'Key': storage_key,
                'ContentType': 'text/csv'
            },
            ExpiresIn=300  # 5 minutes
        )
        return {
            "presigned_url": presigned_url,
            "storage_key": storage_key
        }
    except ClientError as e:
        logger.error(f"Failed to generate upload URL: {e}")
        raise RuntimeError(f"Could not generate upload signature: {str(e)}")

def get_download_presigned_url(storage_key):
    """
    Generates a presigned URL for a GET request to download/view a file.
    """
    s3 = get_r2_client()
    try:
        url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': R2_BUCKET_NAME,
                'Key': storage_key
            },
            ExpiresIn=300
        )
        return url
    except ClientError as e:
        logger.error(f"Failed to generate download URL: {e}")
        raise RuntimeError(f"Could not generate download signature: {str(e)}")

def get_file_content(storage_key):
    """
    Downloads file content from R2 and returns it as a UTF-8 string.
    Primarily used for processing CSV data on the backend.
    """
    s3 = get_r2_client()
    try:
        response = s3.get_object(Bucket=R2_BUCKET_NAME, Key=storage_key)
        content = response['Body'].read().decode('utf-8')
        return content
    except ClientError as e:
        logger.error(f"Failed to read file content for {storage_key}: {e}")
        raise ValueError(f"File could not be read from storage: {str(e)}")

def save_output_file(ca_code, customer_id, financial_year, month, file_name, file_bytes):
    """
    Uploads generated output (Excel) to the permanent outputs/ path.
    Returns the final storage_key.
    """
    s3 = get_r2_client()
    storage_key = f"outputs/{ca_code}/{customer_id}/{financial_year}/{month}/{file_name}"
    
    try:
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=storage_key,
            Body=file_bytes,
            ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        return storage_key
    except ClientError as e:
        logger.error(f"Failed to save output file {storage_key}: {e}")
        raise RuntimeError(f"Failed to save generated report to R2: {str(e)}")

def delete_file(storage_key):
    """
    Deletes an object from the R2 bucket.
    Logs errors but returns a boolean status instead of raising.
    """
    s3 = get_r2_client()
    try:
        s3.delete_object(Bucket=R2_BUCKET_NAME, Key=storage_key)
        return True
    except ClientError as e:
        logger.error(f"Failed to delete object {storage_key}: {e}")
        return False

def list_expired_uploads():
    """
    Lists all objects in the 'uploads/' prefix that were modified more than 90 days ago.
    Returns a list of storage_keys.
    """
    s3 = get_r2_client()
    expired_keys = []
    threshold = datetime.now(timezone.utc) - timedelta(days=90)
    
    try:
        paginator = s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix='uploads/')
        
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    if obj['LastModified'] < threshold:
                        expired_keys.append(obj['Key'])
        
        return expired_keys
    except ClientError as e:
        logger.error(f"Failed to list expired uploads: {e}")
        raise RuntimeError(f"Storage cleanup scanning failed: {str(e)}")
