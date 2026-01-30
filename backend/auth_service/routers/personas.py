from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
import logging

import database, models, schemas

router = APIRouter(prefix="/personas", tags=["Personas"])
logger = logging.getLogger("AuthService.Personas")

def seed_default_personas(db: Session):
    """Seeds default AI personas if table is empty."""
    if db.query(models.Persona).count() == 0:
        logger.info("Seeding default personas...")
        defaults = [
            models.Persona(
                id="nova", name="Nova", color="#22d3ee", voice="af_sarah", 
                system_prompt="You are Nova, an advanced AI assistant focus on daily productivity."
            ),
            models.Persona(
                id="sage", name="Sage", color="#10b981", voice="am_adam", 
                system_prompt="You are Sage, a wise assistant specializing in deep thought and philosophy."
            ),
            models.Persona(
                id="architect", name="Architect", color="#f472b6", voice="am_michael", 
                system_prompt="You are The Architect, an expert in software engineering and system design."
            )
        ]
        db.add_all(defaults)
        db.commit()
        logger.info("Personas seeded.")

@router.get("/", response_model=List[schemas.PersonaBase])
def get_personas(db: Session = Depends(database.get_db)):
    return db.query(models.Persona).filter(models.Persona.is_active == True).all()

@router.post("/", response_model=schemas.PersonaBase, status_code=status.HTTP_201_CREATED)
def create_persona(persona: schemas.PersonaCreate, db: Session = Depends(database.get_db)):
    db_persona = models.Persona(**persona.dict())
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)
    return db_persona