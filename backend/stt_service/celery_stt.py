import os
from celery import Celery

# Load Redis URL from environment variables, defaulting to localhost for local testing
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery application
celery_app = Celery(
    "stt_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"]  # Ensures tasks module is imported when worker starts
)

# Apply Celery configurations for optimization
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_default_queue="stt_queue",  # Dedicated queue to separate STT tasks from others
    worker_prefetch_multiplier=1,    # Prevents the worker from grabbing too many tasks at once (GPU bottleneck)
    task_acks_late=True,             # Acknowledge task only after execution ensures no data loss on crash
)