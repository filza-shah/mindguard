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
    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "MindGuard API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Database ─────────────────────────────────────────────────────────────
    # Format: postgresql+asyncpg://user:password@host:port/dbname
    DATABASE_URL: str = "postgresql+asyncpg://mindguard:mindguard@db:5432/mindguard"
    REDIS_URL: str = "redis://redis:6379/0"

    # ── Auth / JWT ────────────────────────────────────────────────────────────
    # IMPORTANT: Change SECRET_KEY to a long random string in production.
    # Generate one with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "change-me-before-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── Encryption ───────────────────────────────────────────────────────────
    # Used to encrypt sensitive fields (mood notes, journal entries) at rest.
    # Must be a 32-byte URL-safe base64 string.
    # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    ENCRYPTION_KEY: str = "placeholder-generate-a-real-key-before-using"

    # ── AI Layer ─────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Which frontend origins are allowed to call our API.
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",   # Next.js dev server
        "http://localhost:80",     # Nginx in Docker
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


# @lru_cache means this function only runs ONCE — the Settings object is cached.
# Every time you call get_settings() you get the same instance (singleton pattern).
@lru_cache()
def get_settings() -> Settings:
    return Settings()
