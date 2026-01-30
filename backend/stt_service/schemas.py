from pydantic import BaseModel
from typing import List, Optional

class Word(BaseModel):
    word: str
    start: float
    end: float
    probability: float

class Segment(BaseModel):
    id: int
    seek: int
    start: float
    end: float
    text: str
    words: List[Word] = []

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    language_probability: float
    duration: float
    segments: List[Segment] # İleri seviye analiz için