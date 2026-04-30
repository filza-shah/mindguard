# backend/tests/test_auth.py
#
# Basic integration tests for the auth endpoints.
# Run with: pytest tests/ -v
#
# WHY TESTS MATTER FOR YOUR PORTFOLIO:
# Every big tech company requires tests. Having even basic tests shows
# you understand the professional development workflow.

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db

# Use an in-memory SQLite database for tests
# (faster than PostgreSQL, no external dependency needed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.dependency_overrides[get_db] = override_get_db
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


@pytest_asyncio.fixture
async def registered_user(client):
    """Helper: registers a user and returns their credentials."""
    payload = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123",
        "display_name": "Test User",
    }
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    return payload


@pytest_asyncio.fixture
async def auth_headers(client, registered_user):
    """Helper: logs in and returns Authorization headers."""
    res = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"],
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client):
    res = await client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "username": "newuser",
        "password": "password123",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "new@example.com"
    assert data["username"] == "newuser"
    assert "hashed_password" not in data   # must never expose this


@pytest.mark.asyncio
async def test_register_duplicate_email(client, registered_user):
    res = await client.post("/api/v1/auth/register", json={
        "email": registered_user["email"],   # same email
        "username": "different_username",
        "password": "password123",
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


@pytest.mark.asyncio
async def test_register_weak_password(client):
    res = await client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "username": "weakuser",
        "password": "short",   # less than 8 characters
    })
    assert res.status_code == 422  # validation error


@pytest.mark.asyncio
async def test_login_success(client, registered_user):
    res = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"],
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, registered_user):
    res = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": "wrongpassword",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client, auth_headers):
    res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401  # no token = forbidden


# ── Check-In Tests ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_checkin(client, auth_headers):
    res = await client.post("/api/v1/checkins/", json={
        "mood_score": 4,
        "energy_level": 3,
        "anxiety_level": 4,
        "sleep_hours": 7.5,
        "note": "Feeling good today",
        "activities": ["Exercise"],
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["mood_score"] == 4
    assert data["note"] == "Feeling good today"   # decrypted


@pytest.mark.asyncio
async def test_create_checkin_unauthenticated(client):
    res = await client.post("/api/v1/checkins/", json={
        "mood_score": 3,
        "energy_level": 3,
        "anxiety_level": 3,
        "activities": [],
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_list_checkins(client, auth_headers):
    # Create 3 check-ins
    for mood in [3, 4, 5]:
        await client.post("/api/v1/checkins/", json={
            "mood_score": mood,
            "energy_level": 3,
            "anxiety_level": 3,
            "activities": [],
        }, headers=auth_headers)

    res = await client.get("/api/v1/checkins/", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 3


# ── Sentiment Tests ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_sentiment_positive():
    from app.services.sentiment_service import analyse_sentiment
    label, score = analyse_sentiment("Feeling amazing today, so happy and grateful")
    assert label == "positive"
    assert score > 0.5


@pytest.mark.asyncio
async def test_sentiment_negative():
    from app.services.sentiment_service import analyse_sentiment
    label, score = analyse_sentiment("Everything is terrible, feeling hopeless and empty")
    assert label == "negative"
    assert score > 0.5


@pytest.mark.asyncio
async def test_sentiment_neutral():
    from app.services.sentiment_service import analyse_sentiment
    label, score = analyse_sentiment("Just a regular day, nothing special")
    assert label == "neutral"


@pytest.mark.asyncio
async def test_sentiment_empty():
    from app.services.sentiment_service import analyse_sentiment
    label, score = analyse_sentiment("")
    assert label == "neutral"
    assert score == 0.5
