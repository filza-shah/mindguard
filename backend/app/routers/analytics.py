# backend/app/routers/analytics.py

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import MoodCheckIn, AnomalyAlert, User
from app.schemas.user import MoodTrend, AnalyticsSummary

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary, summary="Dashboard summary card")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    total_result = await db.execute(
        select(func.count(MoodCheckIn.id)).where(MoodCheckIn.user_id == current_user.id)
    )
    total_checkins = total_result.scalar() or 0

    avg_7d_result = await db.execute(
        select(func.avg(MoodCheckIn.mood_score))
        .where(MoodCheckIn.user_id == current_user.id)
        .where(MoodCheckIn.created_at >= seven_days_ago)
    )
    avg_mood_7d = avg_7d_result.scalar()
    avg_mood_7d = round(float(avg_mood_7d), 2) if avg_mood_7d else None

    avg_30d_result = await db.execute(
        select(func.avg(MoodCheckIn.mood_score))
        .where(MoodCheckIn.user_id == current_user.id)
        .where(MoodCheckIn.created_at >= thirty_days_ago)
    )
    avg_mood_30d = avg_30d_result.scalar()
    avg_mood_30d = round(float(avg_mood_30d), 2) if avg_mood_30d else None

    trend = "stable"
    if avg_mood_7d and avg_mood_30d:
        diff = avg_mood_7d - avg_mood_30d
        if diff > 0.3:
            trend = "improving"
        elif diff < -0.3:
            trend = "declining"

    streak = await _calculate_streak(db, current_user.id)

    alerts_result = await db.execute(
        select(func.count(AnomalyAlert.id))
        .where(AnomalyAlert.user_id == current_user.id)
        .where(AnomalyAlert.acknowledged == False)
    )
    unacknowledged = alerts_result.scalar() or 0

    return AnalyticsSummary(
        total_checkins=total_checkins,
        avg_mood_7d=avg_mood_7d,
        avg_mood_30d=avg_mood_30d,
        streak_days=streak,
        trend_direction=trend,
        unacknowledged_alerts=unacknowledged,
    )


@router.get("/trends", response_model=list[MoodTrend], summary="Daily mood trend for chart")
async def get_trends(
    days: int = Query(default=30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date_trunc("day", MoodCheckIn.created_at).label("day"),
            func.avg(MoodCheckIn.mood_score).label("avg_mood"),
            func.avg(MoodCheckIn.energy_level).label("avg_energy"),
            func.avg(MoodCheckIn.anxiety_level).label("avg_anxiety"),
            func.count(MoodCheckIn.id).label("checkin_count"),
        )
        .where(MoodCheckIn.user_id == current_user.id)
        .where(MoodCheckIn.created_at >= since)
        .group_by("day")
        .order_by("day")
    )
    rows = result.all()

    return [
        MoodTrend(
            date=row.day.strftime("%Y-%m-%d"),
            avg_mood=round(float(row.avg_mood), 2),
            avg_energy=round(float(row.avg_energy), 2),
            avg_anxiety=round(float(row.avg_anxiety), 2),
            checkin_count=row.checkin_count,
        )
        for row in rows
    ]


async def _calculate_streak(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.date_trunc("day", MoodCheckIn.created_at).label("day"))
        .where(MoodCheckIn.user_id == user_id)
        .group_by("day")
        .order_by(desc("day"))
        .limit(90)
    )
    days_with_checkins = {row.day.date() for row in result.all()}

    streak = 0
    today = datetime.now(timezone.utc).date()
    current = today

    while current in days_with_checkins:
        streak += 1
        current -= timedelta(days=1)

    return streak
