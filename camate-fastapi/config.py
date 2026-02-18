"""
Configuration for the FastAPI microservice.
Reads from environment variables with sensible defaults.
"""
import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # R2 / S3 Storage
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "camate-files"
    R2_ENDPOINT_URL: str = ""

    # Django backend (for internal service-to-service calls if needed)
    DJANGO_INTERNAL_URL: str = "http://localhost:8000"
    DJANGO_SERVICE_SECRET: str = ""  # Shared secret for internal calls

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:8000"]

    # GST Portal API (for GSTIN verification)
    GST_API_BASE_URL: str = "https://api.gst.gov.in"
    GST_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
