import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'camate.settings.development')

app = Celery('camate')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()