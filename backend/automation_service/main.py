from fastapi import FastAPI, HTTPException
from celery.result import AsyncResult
from celery_app import celery_app, health_check_task
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Neural Automation Service", version="1.0.0")

@app.get("/")
def root():
    """
    Root endpoint to verify service status.
    """
    return {"service": "Automation Service", "status": "running"}

@app.post("/tasks/test-worker")
def trigger_test_task():
    """
    Triggers a test task to the Celery worker to verify the async pipeline.
    """
    try:
        task = health_check_task.delay()
        return {"message": "Task submitted", "task_id": task.id}
    except Exception as e:
        logger.error(f"Failed to submit task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    """
    Retrieves the status and result of a background task.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    result = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
    return result