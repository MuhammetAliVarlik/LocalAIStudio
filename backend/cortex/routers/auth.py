from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel

from schemas import Token, UserCreate
from database import get_db
from services.auth import verify_password, create_access_token, create_user, get_user_by_username, reset_password
from config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

# --- REQUEST MODELS ---
class PasswordResetRequest(BaseModel):
    username: str
    recovery_key: str
    new_password: str

@router.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user and returns a Recovery Key.
    Executes in a threadpool to avoid blocking the event loop.
    """
    # Check for existing user
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create user and get recovery key
    created_user = create_user(db=db, user=user)
    
    return {
        "status": "created", 
        "username": user.username,
        "recovery_key": created_user.recovery_key,
        "message": "SAVE THIS KEY! It is the only way to recover your account."
    }

@router.post("/api/reset-password")
def reset_user_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Resets user password using the provided recovery key.
    """
    new_key = reset_password(db, req.username, req.recovery_key, req.new_password)
    
    if not new_key:
        raise HTTPException(status_code=400, detail="Invalid username or recovery key")
        
    return {
        "status": "success",
        "message": "Password updated successfully.",
        "new_recovery_key": new_key
    }

@router.post("/api/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    remember_me: bool = False, # Query Parameter
    db: Session = Depends(get_db)
):
    """
    Authenticates a user and issues a JWT access token.
    
    Args:
        remember_me (bool): If True, extends token validity to 7 days. 
                            Default is standard session time (e.g., 30 mins).
    """
    # Retrieve user
    user = get_user_by_username(db, username=form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Dynamic Token Expiration Strategy
    # Standard: Configured minutes (e.g., 30)
    # Remember Me: 7 Days
    token_duration = timedelta(days=7) if remember_me else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=token_duration
    )
    
    return {"access_token": access_token, "token_type": "bearer"}