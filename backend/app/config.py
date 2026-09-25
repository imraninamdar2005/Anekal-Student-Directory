import os
from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_FILE = BACKEND_DIR / "anekal_directory.db"

def get_default_db_url() -> str:
    env_db = os.getenv("DATABASE_URL")
    if not env_db or env_db in ("sqlite:///./anekal_directory.db", "sqlite:///anekal_directory.db"):
        return f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"
    return env_db

class Settings(BaseSettings):
    PROJECT_NAME: str = "Anekal Student Directory API"
    DATABASE_URL: str = get_default_db_url()
    SECRET_KEY: str = os.getenv("SECRET_KEY", "anekal-secure-secret-key-super-safe-random-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        env_file = ".env"

settings = Settings()

