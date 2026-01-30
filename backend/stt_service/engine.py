import os
import logging
from faster_whisper import WhisperModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("STT_Engine")

class STTEngine:
    """
    Singleton class to manage the lifecycle of the Whisper Model.
    Ensures the model is loaded only once in the worker process.
    """
    
    def __init__(self):
        self.model = None
        self.model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
        self.device = os.getenv("WHISPER_DEVICE", "cuda")  # Defaults to GPU
        # Use float16 for CUDA to save VRAM and increase speed; int8 for CPU
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        self.download_root = "/opt/whisper_models"

    def load_model(self):
        """
        Loads the Faster-Whisper model into memory.
        This method is idempotent; if the model is already loaded, it does nothing.
        """
        if not self.model:
            logger.info(f"🚀 Loading Whisper Model: {self.model_size} on {self.device}...")
            try:
                self.model = WhisperModel(
                    self.model_size, 
                    device=self.device, 
                    compute_type=self.compute_type,
                    download_root=self.download_root
                )
                logger.info("✅ Whisper Model Loaded Successfully.")
            except Exception as e:
                logger.error(f"❌ Failed to load model: {e}")
                raise e

    def transcribe(self, file_path: str) -> dict:
        """
        Performs transcription on the given audio file.
        
        Args:
            file_path (str): The absolute path to the audio file.
            
        Returns:
            dict: A dictionary containing the full text, language metadata, and segments.
        """
        if not self.model:
            self.load_model()

        logger.info(f"🎙️ Transcribing file: {file_path}")
        
        try:
            # beam_size=1 is faster (greedy search). vad_filter=True removes silence.
            segments, info = self.model.transcribe(
                file_path, 
                beam_size=1, 
                vad_filter=True
            )

            # Convert generator to list to force execution
            segment_list = list(segments)

            # Construct the response object
            return {
                "text": " ".join([s.text for s in segment_list]).strip(),
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "segments": [
                    {
                        "start": s.start,
                        "end": s.end,
                        "text": s.text.strip()
                    } for s in segment_list
                ]
            }
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            raise e

# Create a global instance.
# Note: In the API service, this instance exists but load_model is never called.
# In the Worker service, load_model is called at startup.
stt_engine = STTEngine()