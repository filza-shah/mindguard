# backend/app/core/database.py
#
# WHY ASYNC DATABASE?
# FastAPI is built on async Python. If you use a normal (blocking) DB driver,
# every DB query pauses ALL requests — like a single cashier serving everyone.
# With async (asyncpg), other requests are handled while we wait for the DB.

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# The "engine" is the low-level connection pool to PostgreSQL.
# echo=True logs all SQL queries — very useful for debugging, turn off in prod.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,          # keep 10 connections open (reuse them — DB connections are expensive)
    max_overflow=20,       # allow up to 20 extra connections at peak load
)

# A "session" is a single conversation with the database.
# AsyncSessionLocal is a factory that creates new sessions.
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # don't expire objects after commit (avoids lazy load errors)
)


# Base class — all our SQLAlchemy models will inherit from this.
# It gives them the __tablename__, Column(), etc. magic.
class Base(DeclarativeBase):
    pass


# Dependency function — FastAPI injects this into route handlers.
# Usage in a router:  async def my_route(db: AsyncSession = Depends(get_db))
# The "yield" makes it a generator — code after yield runs on cleanup (closes session).
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
