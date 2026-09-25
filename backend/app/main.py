import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User
from app.auth import get_password_hash, verify_password
from app.routers import auth, students, schools, colleges, master_data, import_export, dashboard, audit, users, notes

logger = logging.getLogger("uvicorn")

def ensure_admin_user_idempotent():
    """
    Idempotent admin initialization:
    1. Checks if an Admin account exists.
    2. If no Admin account exists, creates default development admin ('admin' / 'Password@123').
    3. If an Admin account exists (even if renamed), ensures it is active and role is Admin.
    4. Never touches other users, students, schools, colleges, areas, or master data.
    """
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "Admin").first()
        if not admin_user:
            admin_user = db.query(User).filter(User.username == "admin").first()

        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@anekal.org",
                full_name="Anekal System Administrator",
                hashed_password=get_password_hash("Password@123"),
                role="Admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
        else:
            changed = False
            if not admin_user.is_active:
                admin_user.is_active = True
                changed = True
            
            # Check if password hash is missing
            if not admin_user.hashed_password:
                admin_user.hashed_password = get_password_hash("Password@123")
                changed = True
            
            if admin_user.role != "Admin":
                admin_user.role = "Admin"
                changed = True
                
            if changed:
                db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Error ensuring admin user: {e}")
    finally:
        db.close()

def startup_init():
    Base.metadata.create_all(bind=engine)
    ensure_admin_user_idempotent()

# Ensure schema and admin exist at import time
startup_init()

@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_init()
    yield

app = FastAPI(
    title="Anekal Student Directory API",
    description="Streamlined, privacy-conscious student directory management system for Anekal.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(schools.router)
app.include_router(colleges.router)
app.include_router(master_data.router)
app.include_router(import_export.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(users.router)
app.include_router(notes.router)

@app.get("/")
def root():
    return {
        "message": "Anekal Student Directory API is running.",
        "docs": "/docs",
        "version": "2.0.0"
    }
