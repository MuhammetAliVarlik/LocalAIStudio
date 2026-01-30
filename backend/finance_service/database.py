from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Determine if we are using SQLite (requires specific connect_args for threading)
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

# Create Database Engine
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args=connect_args
)

# Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Class for Models
Base = declarative_base()

def get_db():
    """
    Dependency generator for FastAPI routes.
    Ensures the database session is closed after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()