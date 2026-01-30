import os
import requests
import io
import soundfile as sf
from kokoro_onnx import Kokoro
from config import settings

class TTSEngine:
    _instance = None
    kokoro: Kokoro = None

    @classmethod
    def get_instance(cls):
        """Returns the singleton instance of the TTS Engine."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def initialize(self):
        """
        Initializes the model. 
        Checks if model files exist in the persistent volume.
        If not, downloads them securely.
        """
        if not os.path.exists(settings.MODEL_DIR):
            os.makedirs(settings.MODEL_DIR, exist_ok=True)

        # 1. Check and Download Model ONNX
        if not os.path.exists(settings.MODEL_PATH):
            print(f"⬇️ TTS: Downloading Model from {settings.MODEL_URL}...")
            self._download_file(settings.MODEL_URL, settings.MODEL_PATH)
        else:
            print("✅ TTS: Model found in cache.")

        # 2. Check and Download Voices BIN
        if not os.path.exists(settings.VOICES_PATH):
            print(f"⬇️ TTS: Downloading Voices from {settings.VOICES_URL}...")
            self._download_file(settings.VOICES_URL, settings.VOICES_PATH)
        else:
            print("✅ TTS: Voices found in cache.")

        # 3. Load Engine
        print("🔌 TTS: Loading Kokoro ONNX Engine...")
        self.kokoro = Kokoro(settings.MODEL_PATH, settings.VOICES_PATH)
        print("🚀 TTS: Engine Ready.")

    def _download_file(self, url: str, dest: str):
        """Helper to download large files with streaming."""
        try:
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(dest, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
        except Exception as e:
            print(f"❌ TTS: Download failed: {e}")
            # Clean up partial file
            if os.path.exists(dest):
                os.remove(dest)
            raise e

    def generate(self, text: str, voice: str, speed: float, lang: str) -> bytes:
        """
        Generates audio and returns RAW WAV bytes.
        Does not write to disk to ensure high performance.
        """
        if not self.kokoro:
            raise RuntimeError("TTS Engine not initialized")

        # Generate audio samples (numpy array)
        samples, sample_rate = self.kokoro.create(
            text, 
            voice=voice, 
            speed=speed, 
            lang=lang
        )

        # Convert numpy array to WAV bytes in-memory
        byte_io = io.BytesIO()
        sf.write(byte_io, samples, sample_rate, format='WAV')
        byte_io.seek(0)
        
        return byte_io.read()

    def get_voices(self):
        """Returns list of available voices (from voices.json usually, or hardcoded for ONNX)."""
        # Kokoro ONNX doesn't expose a simple list method yet, providing standard ones
        return [
            "af_sarah", "af_bella", "af_nicole", "af_sky",
            "am_adam", "am_michael", "bf_emma", "bf_isabella"
        ]

# Global Instance
tts_engine = TTSEngine.get_instance()