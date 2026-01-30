from sqlalchemy.orm import Session
from datetime import datetime
import secrets
import models, schemas, security

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    recovery_key = secrets.token_hex(8)
    
    db_user = models.User(
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        recovery_key=recovery_key,
        role="admin" if user.username.lower() == "architect" else "user" # Auto-admin for Architect
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_last_login(db: Session, username: str):
    user = get_user_by_username(db, username)
    if user:
        user.last_login = datetime.utcnow()
        db.commit()

def reset_password(db: Session, username: str, recovery_key: str, new_password: str):
    user = get_user_by_username(db, username)
    if not user or user.recovery_key != recovery_key:
        return None
    
    user.hashed_password = security.get_password_hash(new_password)
    user.recovery_key = secrets.token_hex(8) # Rotate key
    db.commit()
    return user.recovery_key