# backend/app/main.py
#
# This is the entry point of the FastAPI application.
# It creates the app, registers all routers, and sets up middleware.

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import get_settings
from app.core.database import engine, Base
from app.routers import auth, checkins, analytics, companion

settings = get_settings()


# ── Lifespan (Startup / Shutdown) ─────────────────────────────────────────────
# The @asynccontextmanager lifespan replaces the old @app.on_event("startup").
# Code before "yield" runs on startup. Code after yield runs on shutdown.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: create all tables if they don't exist
    # In production you'd use Alembic migrations instead — we'll add that in Milestone 2.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅  Database tables verified / created")
    print(f"✅  MindGuard API starting in {settings.ENVIRONMENT} mode")

    yield  # ← application runs here

    # SHUTDOWN
    await engine.dispose()
    print("👋  Database connections closed")


# ── App Instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## MindGuard API 🧠

A behavioural pattern detection and early intervention platform for youth mental health.

### Key capabilities
- **Daily mood check-ins** with encrypted note storage
- **Real-time anomaly detection** to flag concerning patterns  
- **NLP sentiment analysis** on free-text entries
- **AI companion** powered by Claude for supportive conversations
- **Analytics dashboard** with trend visualizations
    """,
    docs_url="/api/docs",      # Swagger UI — visit this in browser during development
    redoc_url="/api/redoc",    # Alternative ReDoc UI
    lifespan=lifespan,
)


# ── Middleware ────────────────────────────────────────────────────────────────
# Middleware runs on EVERY request/response. Order matters — first added = outermost.

# CORS: tells browsers which origins can call our API.
# In dev we allow localhost:3000. In production, set this to your actual domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────
# All routes are prefixed with /api/v1 — the "v1" makes API versioning easy later.
# Example: POST /api/v1/auth/register

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(checkins.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(companion.router, prefix=API_PREFIX)


# ── Health Check ──────────────────────────────────────────────────────────────
# Health check endpoint — used by Docker, load balancers, and monitoring tools
# to know if the service is alive. Should return 200 quickly with no DB queries.
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/api/docs",
    }
