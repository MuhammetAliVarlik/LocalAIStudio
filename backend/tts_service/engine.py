import os
import io
import soundfile as sf
import numpy as np
import logging
from config import settings

# --- COMPATIBILITY FIX ---
# Patch EspeakWrapper to avoid "has no attribute 'set_data_path'" error
# and ensure it plays nice with the system library override.
try:
    from phonemizer.backend.espeak.wrapper import EspeakWrapper
    if not hasattr(EspeakWrapper, 'set_data_path'):
        def _dummy_set_data_path(path):
            pass
        EspeakWrapper.set_data_path = _dummy_set_data_path
except ImportError:
    logging.warning("Phonemizer not found, skipping compatibility patch.")
except Exception as e:
    logging.warning(f"Failed to apply EspeakWrapper patch: {e}")
# -------------------------

from kokoro_onnx import Kokoro

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TTS_Engine")

class TTSEngine:
    """
    High-performance TTS Engine wrapper for Kokoro-ONNX.
    Supports streaming generation by splitting text into sentences.
    """
    
    def __init__(self):
        self.kokoro = None
        self.sample_rate = settings.SAMPLE_RATE

    def initialize(self):
        """
        Lazy loads the ONNX model to manage memory efficiently.
        """
        if not self.kokoro:
            logger.info(f"⏳ Loading TTS Model from {settings.MODEL_PATH}...")
            try:
                self.kokoro = Kokoro(
                    settings.MODEL_PATH, 
                    settings.VOICES_PATH
                )
                logger.info("✅ TTS Model Loaded Successfully.")
            except Exception as e:
                logger.error(f"❌ Failed to load TTS model: {e}")
                # In prod, we might want to download the model here if missing
                raise e

    def get_voices(self):
        """Returns available voice IDs."""
        if not self.kokoro:
            self.initialize()
        return self.kokoro.get_voices()

    def stream_audio(self, text: str, voice: str, speed: float = 1.0):
        """
        Generator function that yields WAV bytes chunk by chunk.
        
        Strategy:
        1. Split text into sentences (heuristic).
        2. Generate audio for each sentence.
        3. Yield bytes immediately to reduce Time-To-First-Byte (TTFB).
        """
        if not self.kokoro:
            self.initialize()

        logger.info(f"🔊 Streaming TTS for: {text[:30]}...")
        
        # Simple sentence splitting (can be improved with NLTK)
        # We split by punctuation to create natural pauses and processing chunks
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        for sentence in sentences:
            if not sentence.strip():
                continue
                
            try:
                # Generate raw audio data (numpy array)
                audio_chunk, _ = self.kokoro.create(
                    text=sentence,
                    voice=voice,
                    speed=speed,
                    lang="en-us"
                )
                
                # Convert numpy array to WAV bytes in-memory
                byte_io = io.BytesIO()
                sf.write(byte_io, audio_chunk, self.sample_rate, format='WAV')
                byte_io.seek(0)
                
                # Yield the WAV data
                yield byte_io.read()
                
            except Exception as e:
                logger.error(f"Error generating chunk for '{sentence}': {e}")
                continue

# Singleton Instance
tts_engine = TTSEngine()