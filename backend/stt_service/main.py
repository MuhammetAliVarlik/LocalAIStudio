import os
import uuid
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException
from celery.result import AsyncResult
from celery_stt import celery_app
from schemas import TranscriptionResponse

app = FastAPI(title="Neural STT Service (Async)", version="2.0.0")

# Define the path for shared storage. 
# This must match the volume mount path in docker-compose.
SHARED_VOL = os.getenv("SHARED_VOL", "/app/shared_data")
os.makedirs(SHARED_VOL, exist_ok=True)

@app.post("/transcribe/async")
async def transcribe_audio_async(file: UploadFile = File(...)):
    """
    Endpoint for asynchronous audio transcription.
    
    Workflow:
    1. Receives an audio file (multipart/form-data).
    2. Saves the file to a shared volume accessible by the worker.
    3. Enqueues a transcription task in Celery.
    4. Returns a task_id immediately (Non-blocking).
    """
    # Generate a unique filename to prevent collisions
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(SHARED_VOL, unique_filename)

    try:
        # Stream the file content to the shared disk asynchronously
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 1024):  # Read in 1MB chunks
                await out_file.write(content)
        
        # Send task to the Celery Worker
        task = celery_app.send_task(
            "tasks.transcribe_audio", 
            args=[file_path], 
            queue="stt_queue"
        )
        
        return {
            "task_id": task.id, 
            "status": "processing", 
            "message": "File queued for transcription successfully."
        }

    except Exception as e:
        # Cleanup file if upload or queuing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload Failed: {str(e)}")

@app.get("/transcribe/result/{task_id}")
def get_transcription_result(task_id: str):
    """
    Polling endpoint to check the status and retrieve results of a task.
    
    Args:
        task_id (str): The ID returned by the /transcribe/async endpoint.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task_result.state
    }

    if task_result.state == 'SUCCESS':
        response["data"] = task_result.result
    elif task_result.state == 'FAILURE':
        response["error"] = str(task_result.result)
    
    # 'PENDING' or 'STARTED' statuses just return the status code
    return response

@app.get("/health")
def health_check():
    """
    Health check endpoint for the API service.
    """
    return {"status": "active", "mode": "async_producer", "shared_storage": SHARED_VOL}