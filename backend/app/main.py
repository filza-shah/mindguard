# backend/app/main.py

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine, Base
from app.routers import auth, checkins, analytics, companion, alerts   # ← added alerts

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅  Database tables verified / created")
    print(f"✅  MindGuard API starting in {settings.ENVIRONMENT} mode")

    yield

    await engine.dispose()
    print("👋  Database connections closed")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## MindGuard API 🧠

A behavioural pattern detection and early intervention platform for youth mental health.

### Key capabilities
- **Daily mood check-ins** with encrypted note storage
- **Real-time anomaly detection** using Z-score algorithm
- **NLP sentiment analysis** on free-text entries
- **AI companion** powered by Claude for supportive conversations
- **Analytics dashboard** with trend visualizations
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(checkins.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(companion.router, prefix=API_PREFIX)
app.include_router(alerts.router, prefix=API_PREFIX)   # ← new


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "docs": "/api/docs"}
