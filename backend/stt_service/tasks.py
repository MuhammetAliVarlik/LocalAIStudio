import os
from celery_stt import celery_app
from engine import stt_engine

# --- WORKER WARM-UP ---
# When the Celery worker imports this module, we explicitly load the model.
# This avoids the delay on the first user request.
stt_engine.load_model()

@celery_app.task(name="tasks.transcribe_audio", bind=True)
def transcribe_audio_task(self, file_path: str):
    """
    Celery task to handle audio transcription.
    
    Args:
        file_path (str): The path to the audio file in the shared volume.
        
    Returns:
        dict: Transcription results.
    """
    try:
        # Perform transcription
        result = stt_engine.transcribe(file_path)
        
        # Cleanup: Remove the temp file from the shared volume to save space
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return result

    except Exception as e:
        # Ensure cleanup happens even if transcription fails
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Propagate exception to mark task as FAILED in Redis
        raise e