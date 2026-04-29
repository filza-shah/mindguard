# backend/app/models/user.py
#
# MODELS = your database tables defined in Python.
# SQLAlchemy maps these classes → PostgreSQL tables.
# Each class attribute with Column() becomes a table column.

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Float, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    YOUTH = "youth"           # the young user being tracked
    GUARDIAN = "guardian"     # parent/counsellor with read access
    ADMIN = "admin"


class MoodLevel(int, enum.Enum):
    VERY_LOW = 1
    LOW = 2
    NEUTRAL = 3
    GOOD = 4
    GREAT = 5


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ── User Model ────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    # UUID primary key — better than integer IDs for security (not guessable)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole), default=UserRole.YOUTH, nullable=False
    )
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Profile fields
    display_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Timestamps — always store in UTC
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    # "back_populates" creates a two-way link: user.checkins and checkin.user
    checkins: Mapped[list["MoodCheckIn"]] = relationship(
        "MoodCheckIn", back_populates="user", cascade="all, delete-orphan"
    )
    anomalies: Mapped[list["AnomalyAlert"]] = relationship(
        "AnomalyAlert", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role})>"


# ── Mood Check-In Model ───────────────────────────────────────────────────────
class MoodCheckIn(Base):
    __tablename__ = "mood_checkins"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Core mood data
    mood_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    energy_level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    anxiety_level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # ⚠️  ENCRYPTED FIELDS — stored as ciphertext in the DB
    # The service layer calls encrypt_field() before saving and decrypt_field() when reading.
    note_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # ML outputs — computed after the check-in is saved
    sentiment_label: Mapped[str | None] = mapped_column(String(20), nullable=True)   # positive/negative/neutral
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)       # 0.0 – 1.0
    
    # Activity tags (stored as comma-separated string for simplicity at this stage)
    activities: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship back to User
    user: Mapped["User"] = relationship("User", back_populates="checkins")

    def __repr__(self) -> str:
        return f"<CheckIn user={self.user_id} mood={self.mood_score}>"


# ── Anomaly Alert Model ───────────────────────────────────────────────────────
class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    severity: Mapped[AlertSeverity] = mapped_column(SAEnum(AlertSeverity), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "mood_drop_3_consecutive"
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # The anomaly detection score (how far from the user's baseline)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Has a guardian/counsellor acknowledged this?
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="anomalies")
