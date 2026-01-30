from faster_whisper import WhisperModel
from config import settings
import os

class STTEngine:
    _instance = None
    model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load_model()
        return cls._instance

    def load_model(self):
        print(f"⬇️  STT: Loading Faster-Whisper ({settings.MODEL_SIZE}) on {settings.DEVICE}...")
        
        # download_root: Modeli kalıcı volume'e indirir
        self.model = WhisperModel(
            settings.MODEL_SIZE, 
            device=settings.DEVICE, 
            compute_type=settings.COMPUTE_TYPE,
            download_root=settings.MODEL_PATH
        )
        print("✅ STT: Model Loaded & Ready.")

    def transcribe(self, audio_path: str):
        if not self.model:
            raise RuntimeError("Model not loaded")

        # Run Inference
        # vad_filter=True -> Sessizliği filtreler (Hallucination'ı engeller)
        # beam_size=5 -> Daha doğru sonuç için 5 farklı olasılığı dener
        segments_generator, info = self.model.transcribe(
            audio_path, 
            beam_size=5, 
            vad_filter=settings.VAD_FILTER,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=True # Kelime bazlı zaman damgası
        )

        # Generator'ı listeye çevir (İşlemi başlatır)
        segments = list(segments_generator)
        
        # Full text birleştirme
        full_text = " ".join([s.text for s in segments]).strip()

        return {
            "text": full_text,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "segments": segments
        }

# Global instance
stt_engine = STTEngine.get_instance()