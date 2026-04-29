# backend/app/schemas/user.py
#
# SCHEMAS = Pydantic models used for request/response validation.
# The DIFFERENCE between Models and Schemas:
#   - Models (SQLAlchemy) = database table structure
#   - Schemas (Pydantic)  = what comes IN via HTTP requests, what goes OUT in responses
#
# This separation is intentional — you never want to directly expose your DB model
# to the outside world (e.g., hashed_password should never leave the server).

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """What the client sends when creating an account."""
    email: EmailStr                          # Pydantic validates email format automatically
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)
    age: Optional[int] = Field(None, ge=10, le=25)  # 10-25 age range for our platform

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        """Only allow letters, numbers, and underscores."""
        if not v.replace("_", "").isalnum():
            raise ValueError("Username must contain only letters, numbers, and underscores")
        return v.lower()


class UserLogin(BaseModel):
    """What the client sends when logging in."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """What we return after successful login."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int   # seconds until expiry


class UserResponse(BaseModel):
    """Safe user data to return to the client — notice: NO hashed_password."""
    id: uuid.UUID
    email: str
    username: str
    display_name: Optional[str]
    role: str
    age: Optional[int]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # allows creating from SQLAlchemy model


# ── Check-In Schemas ──────────────────────────────────────────────────────────

class CheckInCreate(BaseModel):
    """What the client sends when submitting a daily check-in."""
    mood_score: int = Field(..., ge=1, le=5, description="Overall mood: 1=very low, 5=great")
    energy_level: int = Field(..., ge=1, le=5)
    anxiety_level: int = Field(..., ge=1, le=5, description="1=very anxious, 5=calm")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    note: Optional[str] = Field(None, max_length=2000)   # will be encrypted before storage
    activities: Optional[list[str]] = Field(default_factory=list)


class CheckInResponse(BaseModel):
    """What we return after a check-in is saved."""
    id: uuid.UUID
    mood_score: int
    energy_level: int
    anxiety_level: int
    sleep_hours: Optional[float]
    note: Optional[str]           # decrypted note (only shown to the owner)
    sentiment_label: Optional[str]
    sentiment_score: Optional[float]
    activities: Optional[list[str]]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Analytics Schemas ─────────────────────────────────────────────────────────

class MoodTrend(BaseModel):
    """One data point for the mood chart."""
    date: str                      # "2024-06-01"
    avg_mood: float
    avg_energy: float
    avg_anxiety: float
    checkin_count: int


class AnalyticsSummary(BaseModel):
    """Dashboard summary card data."""
    total_checkins: int
    avg_mood_7d: Optional[float]   # last 7 days average
    avg_mood_30d: Optional[float]  # last 30 days average
    streak_days: int               # consecutive days with check-ins
    trend_direction: str           # "improving" | "declining" | "stable"
    unacknowledged_alerts: int


# ── Anomaly Alert Schema ──────────────────────────────────────────────────────

class AnomalyAlertResponse(BaseModel):
    id: uuid.UUID
    severity: str
    alert_type: str
    description: str
    anomaly_score: float
    acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}
