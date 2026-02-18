from celery import shared_task
from services.db_router import create_ca_database

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def provision_tenant_database(self, ca_code: str):
    try:
        success = create_ca_database(ca_code)
        if not success:
            raise RuntimeError(f"Database creation failed for {ca_code}")
        return {"ca_code": ca_code, "status": "provisioned"}
    except Exception as exc:
        raise self.retry(exc=exc)