import logging
from celery import shared_task
from django.utils import timezone
from services.db_router import load_all_ca_databases, get_ca_db_alias
from services.r2 import delete_file
from apps.uploads.models import Upload
from apps.auth_app.models import CAFirm
from django.db import DEFAULT_DB_ALIAS

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_uploads():
    """Runs daily. Deletes uploads past their 90-day expiry from R2 and DB."""
    load_all_ca_databases()
    firms = CAFirm.objects.using(DEFAULT_DB_ALIAS).all()
    total_deleted = 0

    for firm in firms:
        db_alias = get_ca_db_alias(firm.ca_code)
        try:
            expired = Upload.objects.using(db_alias).filter(
                expires_at__lt=timezone.now()
            )
            for upload in expired:
                r2_success = delete_file(upload.storage_key)
                if r2_success:
                    upload.delete(using=db_alias)
                    total_deleted += 1
                    logger.info(f"Deleted expired upload {upload.id} for {firm.ca_code}")
                else:
                    logger.warning(f"R2 delete failed for {upload.storage_key}, skipping DB delete.")
        except Exception as e:
            logger.error(f"Cleanup failed for {firm.ca_code}: {e}")

    logger.info(f"Cleanup complete. Total deleted: {total_deleted}")
    return total_deleted