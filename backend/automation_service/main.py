from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from celery_app import celery_app
from typing import List, Optional
import uuid

app = FastAPI(title="Neural Automation Service")

# In-Memory Scheduler (Persistent DB can be added later)
scheduler = AsyncIOScheduler()

# Task Store (Mock DB)
tasks_db = []

class TaskCreate(BaseModel):
    name: str
    type: str # 'WEB', 'SYSTEM', 'REMINDER'
    interval_minutes: int
    payload: Optional[str] = None

class TaskResponse(TaskCreate):
    id: str
    status: str # 'running', 'stopped'
    last_run: Optional[str] = None

# --- DUMMY EXECUTOR ---
async def execute_task(task_id: str):
    # This logic would call other microservices (e.g., call Info Service for News)
    print(f"⚡ Executing Automation Task: {task_id}")
    # Logic to update 'last_run' in DB goes here

@app.on_event("startup")
def start_scheduler():
    scheduler.start()
    print("⏰ Scheduler Started")

@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate):
    new_task = {
        "id": str(uuid.uuid4()),
        **task.dict(),
        "status": "stopped",
        "last_run": "Never"
    }
    tasks_db.append(new_task)
    return new_task

@app.get("/tasks")
def list_tasks():
    return tasks_db

@app.post("/tasks/{task_id}/toggle")
def toggle_task(task_id: str):
    task = next((t for t in tasks_db if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["status"] == "running":
        # Stop
        if scheduler.get_job(task_id):
            scheduler.remove_job(task_id)
        task["status"] = "stopped"
    else:
        # Start
        scheduler.add_job(
            execute_task, 
            IntervalTrigger(minutes=task["interval_minutes"]), 
            id=task_id, 
            args=[task_id]
        )
        task["status"] = "running"
    
    return task

# --- CELERY TASKS ---
@celery_app.task(name="tasks.heavy_processing")
def heavy_processing_task(data: str):
    import time
    # Simüle edilmiş ağır işlem (Örn: Video render, büyük PDF analizi)
    time.sleep(10) 
    return f"Processed: {data}"

# --- ENDPOINTS ---
@app.post("/tasks/queue")
def queue_task(payload: str):
    """Celery kuyruğuna iş atar"""
    task = heavy_processing_task.delay(payload)
    return {"task_id": task.id, "status": "queued"}

@app.get("/tasks/status/{task_id}")
def get_status(task_id: str):
    """İşin durumunu sorgular"""
    from celery.result import AsyncResult
    task_result = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result
    }