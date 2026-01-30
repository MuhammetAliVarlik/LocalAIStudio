import os
from celery import Celery

# Load environment variables
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery app
celery_app = Celery(
    "automation_worker",
    broker=redis_url,
    backend=redis_url
)

# Configuration for Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # A dedicated queue for default tasks
    task_default_queue="default",
)

@celery_app.task(name="tasks.health_check")
def health_check_task():
    """
    Simple task to verify that the worker is consuming tasks correctly.
    """
    return {"status": "active", "worker": "celery-01"}

if __name__ == "__main__":
    celery_app.start()