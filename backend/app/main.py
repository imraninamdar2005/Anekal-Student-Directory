from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, students, schools, colleges, master_data, import_export, dashboard, audit, users

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Anekal Student Directory API",
    description="Streamlined, privacy-conscious student directory management system for Anekal.",
    version="2.0.0"
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

@app.get("/")
def root():
    return {
        "message": "Anekal Student Directory API is running.",
        "docs": "/docs",
        "version": "2.0.0"
    }
