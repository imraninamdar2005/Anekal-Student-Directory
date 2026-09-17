import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Anekal Student Directory API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./anekal_directory.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "anekal-secure-secret-key-super-safe-random-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        env_file = ".env"

settings = Settings()
