from sqlalchemy import Boolean, Column, Integer, String
from database import Base

class User(Base):
    """
    User Model
    ----------
    Represents the 'users' table in the database.
    Stores authentication credentials, user status, and recovery key.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    # New field for password recovery
    recovery_key = Column(String, nullable=True) 
    disabled = Column(Boolean, default=False)