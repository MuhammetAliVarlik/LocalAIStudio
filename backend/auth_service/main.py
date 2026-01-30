import logging
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Internal module imports
from database import engine, Base, SessionLocal
from models import Persona, User  # Database models
from schemas import PersonaBase, PersonaCreate  # API Schemas (Pydantic)
from routers import auth, users

# Initialize logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AuthService")

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Neural Auth Service",
    description="Microservice for User Management and Authentication",
    version="1.0.0"
)

# Dependency to provide database session per request
def get_db():
    """
    Creates a new SQLAlchemy database session for each request and
    ensures it is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Include feature-specific routers
app.include_router(auth.router)
app.include_router(users.router)

def seed_personas(db: Session):
    """
    Populates the database with default AI personas if the table is empty.
    
    Args:
        db (Session): SQLAlchemy database session.
    """
    if db.query(Persona).count() == 0:
        logger.info("Seeding default personas into the database...")
        defaults = [
            Persona(
                id="nova", 
                name="Nova", 
                color="#22d3ee", 
                voice="af_sarah", 
                system_prompt="You are Nova, an advanced AI assistant focus on daily productivity."
            ),
            Persona(
                id="sage", 
                name="Sage", 
                color="#10b981", 
                voice="am_adam", 
                system_prompt="You are Sage, a wise assistant specializing in deep thought and philosophy."
            ),
            Persona(
                id="architect", 
                name="Architect", 
                color="#f472b6", 
                voice="am_michael", 
                system_prompt="You are The Architect, an expert in software engineering and system design."
            )
        ]
        db.add_all(defaults)
        db.commit()
        logger.info("Persona seeding completed successfully.")

@app.on_event("startup")
async def startup_event():
    """
    Tasks to execute when the application starts.
    """
    db = SessionLocal()
    try:
        seed_personas(db)
    finally:
        db.close()

# --- PERSONA MANAGEMENT ENDPOINTS ---

@app.get("/personas", response_model=List[PersonaBase])
def get_personas(db: Session = Depends(get_db)):
    """
    Retrieves all active AI personas from the database.
    """
    return db.query(Persona).filter(Persona.is_active == True).all()

@app.post("/personas", response_model=PersonaBase, status_code=status.HTTP_201_CREATED)
def create_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    """
    Creates a new custom AI persona.
    
    Args:
        persona (PersonaCreate): Pydantic schema for persona creation.
        db (Session): Database session.
    """
    db_persona = Persona(**persona.dict())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@app.get("/health")
def health_check():
    """
    Service health check endpoint for monitoring tools.
    """
    return {
        "status": "active", 
        "service": "auth_service",
        "version": "1.0.0"
    }