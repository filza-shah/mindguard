# backend/app/core/config.py
#
# WHY THIS FILE EXISTS:
# Hard-coding secrets (DB passwords, API keys) in your code is a major security
# mistake. Instead, we read everything from environment variables — which come
# from a .env file locally, and from your cloud provider's secret manager in prod.
# Pydantic's BaseSettings automatically reads os.environ for us.

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "MindGuard API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://mindguard:mindguard@db:5432/mindguard"
    REDIS_URL: str = "redis://redis:6379/0"

    SECRET_KEY: str = "change-me-before-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    ENCRYPTION_KEY: str = "placeholder-generate-a-real-key-before-using"

    ANTHROPIC_API_KEY: str = ""

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:80"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()