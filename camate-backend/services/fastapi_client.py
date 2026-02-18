import requests
import logging
from decouple import config

logger = logging.getLogger(__name__)

# Configuration
BASE_URL = config('FASTAPI_SERVICE_URL', default='http://localhost:8001')
TIMEOUT = config('FASTAPI_TIMEOUT', default=120, cast=int)

def _post_request(endpoint: str, payload: dict) -> dict:
    url = f"{BASE_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    try:
        logger.info(f"Calling FastAPI: POST {url}")
        response = requests.post(url, json=payload, timeout=TIMEOUT)

        if response.status_code not in (200, 201):
            error_data = response.text
            logger.error(f"FastAPI error ({response.status_code}): {error_data}")
            raise ValueError(f"FastAPI Service Error: {error_data}")

        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"FastAPI Connection Error at {url}: {e}")
        raise ConnectionError("Unable to reach the financial processing service. Is FastAPI running on port 8001?")

def trigger_gstr1_generation(payload: dict) -> dict:
    """
    POST {BASE_URL}/gstr1/generate
    Expected payload: { ca_code, customer_id, financial_year, month, upload_keys: [] }
    """
    return _post_request("/gstr1/generate", payload)

def trigger_verification(payload: dict) -> dict:
    """
    POST {BASE_URL}/verification/run
    Returns verification metadata and run_id.
    """
    return _post_request("/verification/run", payload)

def convert_format(storage_key: str, format: str) -> dict:
    """
    POST {BASE_URL}/convert/{format}
    Converts a Tally/Excel file to standard CSV.
    """
    return _post_request(f"/convert/{format}", {"storage_key": storage_key})
