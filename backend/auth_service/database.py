from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings
import os

# Ensure workspace directory exists
if not os.path.exists(settings.WORKSPACE_DIR):
    os.makedirs(settings.WORKSPACE_DIR)

# SQLite Connection
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} # Needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency injection for DB Session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()