import secrets
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.orm import Session
from config import SECRET_KEY, ALGORITHM
from models import User
from schemas import UserCreate

"""
AUTH SERVICE
Handles password hashing, token generation, and database interactions.
"""

# Password Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def generate_recovery_key():
    """Generates a secure random recovery key."""
    return secrets.token_hex(8)  # e.g., 'a1b2c3d4e5f6g7h8'

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    """Creates a new user with a recovery key."""
    hashed_password = get_password_hash(user.password)
    recovery_key = generate_recovery_key()
    
    db_user = User(
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        recovery_key=recovery_key
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def reset_password(db: Session, username: str, recovery_key: str, new_password: str):
    """Resets password if recovery key matches."""
    user = get_user_by_username(db, username)
    if not user:
        return False
    
    # Verify Recovery Key
    if user.recovery_key != recovery_key:
        return False
    
    # Update Password
    user.hashed_password = get_password_hash(new_password)
    # Rotate recovery key for security
    user.recovery_key = generate_recovery_key()
    
    db.commit()
    db.refresh(user)
    return user.recovery_key # Return new key to user