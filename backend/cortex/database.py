from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import WORKSPACE_DIR
import os

"""
DATABASE CONFIGURATION
----------------------
Sets up the SQLite database connection using SQLAlchemy.
The database file is stored securely in the workspace directory to ensure persistence.
"""

# Path to the SQLite database file
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(WORKSPACE_DIR, 'cortex.db')}"

# Create the database engine
# check_same_thread=False is required for SQLite when accessed by multiple threads (FastAPI default)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a session factory
# autocommit/autoflush are disabled to allow explicit transaction management
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

def get_db():
    """
    Dependency generator for database sessions.
    Creates a new session for each request and ensures it closes afterwards.
    Yields:
        Session: The database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()