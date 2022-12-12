import os

from celery import Celery
from celery.schedules import crontab
import sys
sys.path.append("..")
from monitor.tasks import request_data_from_stations

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'supernova_meteo.settings')

app = Celery('supernova_meteo')

@app.on_after_configure.connect
# @app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls test('hello') every 10 seconds.
    sender.add_periodic_task(1000.0, request_data_from_stations.s(), name='add every 10')

    # sender.add_periodic_task(
    #     crontab(hour=7, minute=30),
    #     request_data_from_stations.s(),
    # )

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

app.conf.timezone = 'Europe/Moscow'

@app.task
def test(arg):
    print(arg)
