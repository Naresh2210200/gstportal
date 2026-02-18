"""
R2 Storage helper for the FastAPI service.
Mirrors the Django service but uses async-friendly patterns.
"""
import boto3
import logging
from botocore.config import Config
from botocore.exceptions import ClientError
from config import settings

logger = logging.getLogger(__name__)

_client = None

def get_r2_client():
    global _client
    if _client is None:
        endpoint = settings.R2_ENDPOINT_URL or f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        _client = boto3.client(
            's3',
            endpoint_url=endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
    return _client


def read_file(storage_key: str) -> str:
    """Download a file from R2 and return its content as a UTF-8 string."""
    s3 = get_r2_client()
    try:
        response = s3.get_object(Bucket=settings.R2_BUCKET_NAME, Key=storage_key)
        return response['Body'].read().decode('utf-8')
    except ClientError as e:
        logger.error(f"R2 read error for {storage_key}: {e}")
        raise ValueError(f"Cannot read file from storage: {storage_key}")


def save_file(storage_key: str, content: bytes, content_type: str = 'application/octet-stream') -> str:
    """Upload bytes to R2 and return the storage key."""
    s3 = get_r2_client()
    try:
        s3.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=storage_key,
            Body=content,
            ContentType=content_type
        )
        return storage_key
    except ClientError as e:
        logger.error(f"R2 write error for {storage_key}: {e}")
        raise RuntimeError(f"Cannot save file to storage: {storage_key}")


def get_presigned_download_url(storage_key: str, expires_in: int = 300) -> str:
    """Generate a presigned GET URL for a file in R2."""
    s3 = get_r2_client()
    try:
        return s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.R2_BUCKET_NAME, 'Key': storage_key},
            ExpiresIn=expires_in
        )
    except ClientError as e:
        logger.error(f"Presign error for {storage_key}: {e}")
        raise RuntimeError(f"Cannot generate download URL: {storage_key}")
