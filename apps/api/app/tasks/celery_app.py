from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "vakkil",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.document_tasks", "app.tasks.reminder_tasks", "app.tasks.ecourts_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "hearing-reminders-daily": {
            "task": "send_hearing_reminders",
            "schedule": crontab(hour=8, minute=0),
        },
        "monthly-document-reset": {
            "task": "reset_monthly_document_counts",
            "schedule": crontab(day_of_month=1, hour=0, minute=0),
        },
    },
)
