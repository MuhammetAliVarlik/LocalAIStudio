import os
import uuid
import aiofiles
import asyncio
import logging
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from celery.result import AsyncResult
from celery_stt import celery_app
from engine import stt_engine  # Direct access for real-time streams

# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("STT_Service")

app = FastAPI(title="Neural STT Service (Async + Stream)", version="2.1.2")

SHARED_VOL = os.getenv("SHARED_VOL", "/app/shared_data")
os.makedirs(SHARED_VOL, exist_ok=True)

# --- REAL-TIME STREAMING ENDPOINT ---
@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    Real-time Audio Streaming Endpoint.
    - Receives Binary Audio Chunks
    - Receives 'COMMIT' Text Signal to Transcribe
    """
    await websocket.accept()
    
    session_id = str(uuid.uuid4())[:8]
    temp_filename = f"stream_{session_id}.webm"
    temp_file_path = os.path.join(SHARED_VOL, temp_filename)
    
    logger.info(f"🔌 WS Connected: {session_id}")

    chunk_count = 0 

    try:
        # Open file for the duration of the connection
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            while True:
                try:
                    # Wait for data
                    message = await websocket.receive()
                except RuntimeError:
                    # Socket closed/disconnected
                    logger.info(f"⚠️ Socket closed during receive: {session_id}")
                    break
                except WebSocketDisconnect:
                    logger.info(f"🔌 Client Disconnected: {session_id}")
                    break

                # 1. Handle Binary Audio Data
                if "bytes" in message and message["bytes"]:
                    await out_file.write(message["bytes"])
                    await out_file.flush()
                    
                    # LOGGING: Print a dot every 20 chunks so we know data is flowing
                    chunk_count += 1
                    if chunk_count % 20 == 0:
                        logger.info(f"🔹 Receiving Audio Stream ({chunk_count} chunks)...")
                
                # 2. Handle 'COMMIT' Signal (The VAD Trigger)
                elif "text" in message and message["text"] == "COMMIT":
                    logger.info(f"🛑 Silence Detected. Transcribing {chunk_count} chunks...")
                    
                    # Ensure all data is on disk
                    await out_file.flush()
                    
                    if os.path.getsize(temp_file_path) > 0:
                        try:
                            # Run Inference in a separate thread to keep WS alive
                            loop = asyncio.get_event_loop()
                            result = await loop.run_in_executor(
                                None, 
                                stt_engine.transcribe, 
                                temp_file_path
                            )
                            
                            text = result.get("text", "").strip()
                            
                            if text:
                                # --- THIS IS THE LOG YOU ARE LOOKING FOR ---
                                logger.info(f"✅ STT RESULT: {text}") 
                                await websocket.send_json({
                                    "type": "transcription", 
                                    "text": text
                                })
                            else:
                                logger.info("⚠️ Audio was empty or unclear (No text detected).")

                            # Reset: Clear the file for the next sentence
                            await out_file.close()
                            # Truncate/Clear content
                            with open(temp_file_path, 'wb') as f: 
                                pass 
                            # Reopen file handle
                            out_file = await aiofiles.open(temp_file_path, 'wb')
                            chunk_count = 0
                            
                        except Exception as e:
                            logger.error(f"Transcription Error: {e}")
                            await websocket.send_json({"error": str(e)})
                    else:
                        logger.info("⚠️ Received COMMIT but file was empty.")

    except WebSocketDisconnect:
        logger.info(f"🔌 WS Disconnected (Clean): {session_id}")
    except Exception as e:
        logger.error(f"WS Critical Error: {e}")
    finally:
        # Cleanup temp file on exit
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass

# --- EXISTING ASYNC ENDPOINTS ---
@app.post("/transcribe/async")
async def transcribe_audio_async(file: UploadFile = File(...)):
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(SHARED_VOL, unique_filename)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 1024):
                await out_file.write(content)
        
        task = celery_app.send_task("tasks.transcribe_audio", args=[file_path], queue="stt_queue")
        return {"task_id": task.id, "status": "processing"}

    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transcribe/result/{task_id}")
def get_transcription_result(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    response = {"task_id": task_id, "status": task_result.state}

    if task_result.state == 'SUCCESS':
        response["data"] = task_result.result
    elif task_result.state == 'FAILURE':
        response["error"] = str(task_result.result)
    
    return response

@app.get("/health")
def health_check():
    return {"status": "active", "mode": "hybrid"}