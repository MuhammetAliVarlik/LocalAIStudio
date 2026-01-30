from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="user")
    recovery_key = Column(String, nullable=True)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

class Persona(Base):
    """AI Characters Table"""
    __tablename__ = "personas"
    id = Column(String, primary_key=True, index=True) # e.g. "nova"
    name = Column(String)
    system_prompt = Column(Text)
    color = Column(String) # Frontend Hex Code
    voice = Column(String) # TTS Voice ID
    is_active = Column(Boolean, default=True)