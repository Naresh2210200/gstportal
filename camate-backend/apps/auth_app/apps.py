from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class AuthAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.auth_app'

    def ready(self):
        """
        Called when the application starts. Loads all CA databases into the registry.
        """
        from services.db_router import load_all_ca_databases
        try:
            load_all_ca_databases()
        except Exception as e:
            logger.warning(
                f"Tenant DB pre-loading skipped (normal on first run or migrations): {e}"
            )