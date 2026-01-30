from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError

import schemas, database, crud, security
from config import settings

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=dict)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    created_user = crud.create_user(db, user)
    return {
        "status": "created",
        "username": created_user.username,
        "recovery_key": created_user.recovery_key,
        "message": "Store this recovery key safely."
    }

@router.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if user.disabled:
        raise HTTPException(status_code=403, detail="User account is disabled")

    # Update Audit Log
    crud.update_last_login(db, user.username)

    # Generate Tokens
    access_token = security.create_access_token(data={"sub": user.username})
    refresh_token = security.create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(token: str, db: Session = Depends(database.get_db)):
    """Generates a new Access Token using a valid Refresh Token."""
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username)
    if not user:
        raise credentials_exception

    new_access_token = security.create_access_token(data={"sub": user.username})
    
    return {
        "access_token": new_access_token,
        "refresh_token": token, # Return existing refresh token (or rotate it)
        "token_type": "bearer"
    }

@router.post("/reset-password")
def reset_password(req: schemas.PasswordResetRequest, db: Session = Depends(database.get_db)):
    new_key = crud.reset_password(db, req.username, req.recovery_key, req.new_password)
    if not new_key:
        raise HTTPException(status_code=400, detail="Invalid username or recovery key")
    return {"status": "success", "message": "Password updated", "new_recovery_key": new_key}