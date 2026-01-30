from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ==========================================
# AUTHENTICATION & TOKEN SCHEMAS
# ==========================================

class Token(BaseModel):
    """Schema for JWT Token response."""
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    """
    Schema for User Login (JSON Body).
    Frontend sends JSON, not Form-Data.
    """
    username: str
    password: str

# ==========================================
# USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    disabled: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==========================================
# RECOVERY SCHEMAS
# ==========================================

class PasswordResetRequest(BaseModel):
    username: str
    recovery_key: str
    new_password: str

# ==========================================
# PERSONA SCHEMAS
# ==========================================

class PersonaBase(BaseModel):
    id: str
    name: str
    system_prompt: str
    color: str
    voice: str

class PersonaCreate(PersonaBase):
    pass

class PersonaResponse(PersonaBase):
    is_active: bool
    class Config:
        from_attributes = True