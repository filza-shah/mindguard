# backend/app/routers/checkins.py
#
# KEY CHANGE from Milestone 2:
# After saving a check-in, we now trigger TWO background tasks:
# 1. Sentiment analysis on the note text
# 2. Anomaly detection on the mood scores
#
# WHY BACKGROUND TASKS?
# Both operations take time. If we ran them synchronously, the user
# would have to wait for them before getting a response.
# With background tasks, we return the response immediately (fast UX)
# and the analysis runs right after, updating the record in the DB.

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db, AsyncSessionLocal
from app.core.security import encrypt_field, decrypt_field
from app.core.deps import get_current_user
from app.models.user import MoodCheckIn, User
from app.schemas.user import CheckInCreate, CheckInResponse
from app.services.sentiment_service import analyse_sentiment
from app.services.anomaly_detection import run_anomaly_detection

router = APIRouter(prefix="/checkins", tags=["Mood Check-Ins"])


def _serialize_checkin(checkin: MoodCheckIn) -> dict:
    return {
        "id": checkin.id,
        "mood_score": checkin.mood_score,
        "energy_level": checkin.energy_level,
        "anxiety_level": checkin.anxiety_level,
        "sleep_hours": checkin.sleep_hours,
        "note": decrypt_field(checkin.note_encrypted) if checkin.note_encrypted else None,
        "sentiment_label": checkin.sentiment_label,
        "sentiment_score": checkin.sentiment_score,
        "activities": checkin.activities.split(",") if checkin.activities else [],
        "created_at": checkin.created_at,
    }


# ── Background Task Functions ─────────────────────────────────────────────────
# These run AFTER the HTTP response is sent to the client.
# They create their own DB session because the request session is already closed.

async def _run_post_checkin_analysis(
    checkin_id: uuid.UUID,
    user_id: uuid.UUID,
    note_text: str | None,
):
    """
    Runs sentiment analysis + anomaly detection after a check-in is saved.
    Creates a fresh DB session since the request session is closed by now.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Reload the check-in from DB
            result = await db.execute(
                select(MoodCheckIn).where(MoodCheckIn.id == checkin_id)
            )
            checkin = result.scalar_one_or_none()
            if not checkin:
                return

            # ── Step 1: Sentiment Analysis ─────────────────────────────────
            if note_text and note_text.strip():
                label, score = analyse_sentiment(note_text)
                checkin.sentiment_label = label
                checkin.sentiment_score = score
                await db.flush()
                print(f"✅ Sentiment: '{label}' ({score:.2f}) for checkin {checkin_id}")

            # ── Step 2: Anomaly Detection ──────────────────────────────────
            alert = await run_anomaly_detection(db, user_id, checkin)
            if alert:
                print(
                    f"🚨 Anomaly alert created: {alert.severity.value} — "
                    f"{alert.alert_type} for user {user_id}"
                )

            await db.commit()

        except Exception as e:
            await db.rollback()
            print(f"❌ Background analysis failed for checkin {checkin_id}: {e}")


# ── Route Handlers ────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a daily mood check-in",
)
async def create_checkin(
    data: CheckInCreate,
    background_tasks: BackgroundTasks,   # ← FastAPI injects this automatically
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a mood check-in.

    After saving to DB, triggers two background tasks:
    - Sentiment analysis on the note (if provided)
    - Anomaly detection comparing mood to the user's 30-day baseline
    """
    encrypted_note = encrypt_field(data.note) if data.note else None

    checkin = MoodCheckIn(
        user_id=current_user.id,
        mood_score=data.mood_score,
        energy_level=data.energy_level,
        anxiety_level=data.anxiety_level,
        sleep_hours=data.sleep_hours,
        note_encrypted=encrypted_note,
        activities=",".join(data.activities) if data.activities else None,
    )

    db.add(checkin)
    await db.flush()
    await db.refresh(checkin)

    # Schedule background analysis — runs after response is sent
    background_tasks.add_task(
        _run_post_checkin_analysis,
        checkin_id=checkin.id,
        user_id=current_user.id,
        note_text=data.note,
    )

    return _serialize_checkin(checkin)


@router.get(
    "/",
    response_model=list[CheckInResponse],
    summary="Get check-in history (paginated)",
)
async def list_checkins(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MoodCheckIn)
        .where(MoodCheckIn.user_id == current_user.id)
        .order_by(desc(MoodCheckIn.created_at))
        .offset(skip)
        .limit(limit)
    )
    checkins = result.scalars().all()
    return [_serialize_checkin(c) for c in checkins]


@router.get(
    "/{checkin_id}",
    response_model=CheckInResponse,
    summary="Get a specific check-in by ID",
)
async def get_checkin(
    checkin_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MoodCheckIn).where(
            MoodCheckIn.id == checkin_id,
            MoodCheckIn.user_id == current_user.id,
        )
    )
    checkin = result.scalar_one_or_none()

    if not checkin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found")

    return _serialize_checkin(checkin)
