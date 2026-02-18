import logging
import re
import threading
from django.db import connections, DEFAULT_DB_ALIAS
from django.conf import settings
from django.core.management import call_command
from decouple import config

logger = logging.getLogger(__name__)

# ─── Thread-local tenant context ─────────────────────────────────────────────
_thread_local = threading.local()

def set_current_ca_code(ca_code):
    """Set the current CA code for this request thread."""
    _thread_local.ca_code = ca_code

def get_current_ca_code():
    """Get the current CA code for this request thread."""
    return getattr(_thread_local, 'ca_code', None)


def sanitize_code(code: str) -> str:
    if not re.match(r'^[a-zA-Z0-9_]+$', code):
        raise ValueError(f"Invalid identifier format: {code}")
    return code

def get_ca_db_name(ca_code: str) -> str:
    """Returns the physical database name: e.g., 'ca_abc123_db'."""
    return f"ca_{sanitize_code(ca_code).lower()}_db"

def get_ca_db_alias(ca_code: str) -> str:
    """Returns the Django database alias: e.g., 'ca_abc123'."""
    return f"ca_{sanitize_code(ca_code).lower()}"

def _is_sqlite() -> bool:
    """Check if the master database is SQLite (local dev mode)."""
    default_db = settings.DATABASES.get(DEFAULT_DB_ALIAS, {})
    engine = default_db.get('ENGINE', '')
    return 'sqlite3' in engine

def register_ca_database(ca_code: str):
    """
    Dynamically adds a CA database to Django's DATABASES dictionary at runtime.
    For SQLite (dev), all tenant data goes into the same default DB.
    """
    if _is_sqlite():
        # In SQLite mode, we don't create separate DBs — everything in default
        return DEFAULT_DB_ALIAS

    db_alias = get_ca_db_alias(ca_code)
    db_name = get_ca_db_name(ca_code)

    if db_alias in settings.DATABASES:
        return db_alias

    # Clone default config and swap the DB name (PostgreSQL only)
    new_db_config = settings.DATABASES[DEFAULT_DB_ALIAS].copy()
    new_db_config['NAME'] = db_name

    settings.DATABASES[db_alias] = new_db_config
    connections.databases[db_alias] = new_db_config

    return db_alias

def create_ca_database(ca_code: str) -> bool:
    """
    Creates a new physical database and runs migrations.
    - SQLite (dev): no-op, uses default DB
    - PostgreSQL (prod): creates a new physical DB
    """
    if _is_sqlite():
        logger.info(f"SQLite mode: skipping separate DB creation for CA {ca_code}")
        return True

    # PostgreSQL path — import psycopg2 only when needed
    try:
        import psycopg2
    except ImportError:
        logger.error("psycopg2 not installed. Cannot create PostgreSQL tenant database.")
        return False

    ca_code = sanitize_code(ca_code)
    db_name = get_ca_db_name(ca_code)
    db_alias = get_ca_db_alias(ca_code)
    master_url = config('MASTER_DB_URL')

    try:
        conn = psycopg2.connect(master_url)
        conn.autocommit = True
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
        if not cursor.fetchone():
            cursor.execute(f"CREATE DATABASE {db_name}")
            logger.info(f"Created physical database: {db_name}")

        cursor.close()
        conn.close()

        register_ca_database(ca_code)
        call_command('migrate', '--database', db_alias, interactive=False)
        logger.info(f"Successfully migrated database: {db_alias}")

        return True
    except Exception as e:
        logger.error(f"Failed to provision database for {ca_code}: {e}")
        return False

def load_all_ca_databases():
    """
    Queries the master registry for all CA firms and registers their DBs.
    Called on Django startup (SQLite mode: no-op).
    """
    if _is_sqlite():
        return

    from apps.auth_app.models import CAFirm
    try:
        firms = CAFirm.objects.using(DEFAULT_DB_ALIAS).all()
        for firm in firms:
            register_ca_database(firm.ca_code)
        logger.info(f"Initialized {firms.count()} tenant database connections.")
    except Exception as e:
        logger.warning(f"CA database loading skipped (registry may not be initialized): {e}")


class CADatabaseRouter:
    """
    Routes database operations between the master (default) and tenant silos.

    Master DB apps: auth_app, plus all Django built-ins (admin, auth, sessions, etc.)
    Tenant DB apps: users, uploads, outputs
    """
    # All apps whose tables live in the master / default database
    master_apps = frozenset({
        'auth_app',
        'admin',
        'auth',
        'contenttypes',
        'sessions',
        'messages',
        'staticfiles',
        'token_blacklist',       # simplejwt blacklist
        'rest_framework',
    })

    def db_for_read(self, model, **hints):
        app = model._meta.app_label
        if app in self.master_apps:
            return DEFAULT_DB_ALIAS

        # In SQLite dev mode, everything goes to default
        if _is_sqlite():
            return DEFAULT_DB_ALIAS

        # In PostgreSQL mode, route to tenant DB based on thread-local ca_code
        ca_code = get_current_ca_code()
        if ca_code:
            return get_ca_db_alias(ca_code)

        return DEFAULT_DB_ALIAS

    def db_for_write(self, model, **hints):
        return self.db_for_read(model, **hints)

    def allow_relation(self, obj1, obj2, **hints):
        if obj1._state.db == obj2._state.db:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == DEFAULT_DB_ALIAS:
            # Master DB: migrate Django built-ins + auth_app + tenant apps (SQLite dev)
            if _is_sqlite():
                return True  # SQLite: migrate everything to default
            return app_label in self.master_apps
        else:
            # Tenant DB (PostgreSQL only): migrate tenant apps only
            return app_label not in self.master_apps