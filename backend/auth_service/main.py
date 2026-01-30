from fastapi import FastAPI
from database import engine, Base
from routers import auth, users
from models import User, Persona
from schemas import PersonaCreate
from sqlalchemy.orm import Session

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Neural Auth Service",
    description="Microservice for User Management and Authentication",
    version="1.0.0"
)

# Register Routers
app.include_router(auth.router)
app.include_router(users.router)

# --- INITIAL DATA SEEDING ---
def seed_personas(db: Session):
    """Veritabanı boşsa varsayılan personaları ekler."""
    if db.query(Persona).count() == 0:
        defaults = [
            Persona(id="nova", name="Nova", color="#22d3ee", voice="af_sarah", system_prompt="You are Nova, a helpful AI."),
            Persona(id="sage", name="Sage", color="#10b981", voice="am_adam", system_prompt="You are Sage, a wise philosopher."),
            Persona(id="architect", name="Architect", color="#f472b6", voice="am_michael", system_prompt="You are The Architect, a coding expert.")
        ]
        db.add_all(defaults)
        db.commit()

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    seed_personas(db)
    db.close()

# --- PERSONA ROUTES ---
@app.get("/personas", response_model=list[PersonaBase])
def get_personas(db: Session = Depends(get_db)):
    return db.query(Persona).filter(Persona.is_active == True).all()

@app.post("/personas")
def create_persona(persona: PersonaCreate, db: Session = Depends(get_db)):
    db_persona = Persona(**persona.dict())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona

@app.get("/health")
def health_check():
    return {"status": "active", "service": "auth_service"}