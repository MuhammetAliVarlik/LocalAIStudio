from kokoro_onnx import Kokoro
from config import TTS_MODEL_PATH, TTS_VOICES_PATH

_kokoro_instance = None

def get_kokoro():
    global _kokoro_instance
    if _kokoro_instance: return _kokoro_instance
    try:
        print("🔊 Loading Kokoro...")
        _kokoro_instance = Kokoro(TTS_MODEL_PATH, TTS_VOICES_PATH)
        return _kokoro_instance
    except Exception as e:
        print(f"❌ Kokoro Failed: {e}")
        return None