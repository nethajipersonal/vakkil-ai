import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

_s3 = boto3.client(
    "s3",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)


def upload_pdf(pdf_bytes: bytes, key: str) -> str:
    _s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=pdf_bytes,
        ContentType="application/pdf",
        ServerSideEncryption="AES256",
    )
    return key


def generate_presigned_url(key: str, expiry_seconds: int = 3600) -> str:
    try:
        url: str = _s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
            ExpiresIn=expiry_seconds,
        )
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to generate presigned URL: {e}") from e
