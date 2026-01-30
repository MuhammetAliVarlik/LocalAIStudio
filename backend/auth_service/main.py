import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import engine, Base, SessionLocal
from routers import auth, users, personas

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AuthService")

# Create Tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown logic."""
    # Startup
    db = SessionLocal()
    try:
        personas.seed_default_personas(db)
    finally:
        db.close()
    
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Neural Auth Service",
    description="Microservice for User Management",
    version="1.0.0",
    lifespan=lifespan
)

# Register Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(personas.router)

@app.get("/health")
def health_check():
    return {"status": "active", "service": "auth_service", "version": "1.0.0"}