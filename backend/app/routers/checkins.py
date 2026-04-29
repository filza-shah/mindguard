# backend/app/routers/checkins.py
#
# Handles all mood check-in related endpoints.
# POST /checkins        — submit a new check-in
# GET  /checkins        — list your check-in history (paginated)
# GET  /checkins/{id}   — get a specific check-in

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import encrypt_field, decrypt_field
from app.models.user import MoodCheckIn, User
from app.schemas.user import CheckInCreate, CheckInResponse

router = APIRouter(prefix="/checkins", tags=["Mood Check-Ins"])


def _serialize_checkin(checkin: MoodCheckIn) -> dict:
    """
    Convert a MoodCheckIn model to a dict suitable for CheckInResponse.
    
    We decrypt the note here — it was stored encrypted, clients need the plaintext.
    We also split the comma-separated activities back into a list.
    """
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


@router.post(
    "/",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a daily mood check-in",
)
async def create_checkin(
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    # TODO: Replace hardcoded user_id with: current_user: User = Depends(get_current_user)
):
    """
    Submit a mood check-in for the current user.
    
    The flow:
    1. Validate input (Pydantic does this automatically)
    2. Encrypt the note field before storing
    3. Save to database
    4. Trigger sentiment analysis (async, non-blocking) — Milestone 3
    5. Trigger anomaly detection — Milestone 3
    6. Return the saved check-in
    """
    # TEMPORARY: hardcoded user for skeleton. Replace with JWT auth in Milestone 2.
    TEMP_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Encrypt the free-text note before persisting
    encrypted_note = encrypt_field(data.note) if data.note else None

    checkin = MoodCheckIn(
        user_id=TEMP_USER_ID,
        mood_score=data.mood_score,
        energy_level=data.energy_level,
        anxiety_level=data.anxiety_level,
        sleep_hours=data.sleep_hours,
        note_encrypted=encrypted_note,
        activities=",".join(data.activities) if data.activities else None,
        # sentiment_label and sentiment_score will be filled by the ML service
    )

    db.add(checkin)
    await db.flush()
    await db.refresh(checkin)

    # TODO Milestone 3: trigger background task for sentiment analysis
    # background_tasks.add_task(run_sentiment_analysis, checkin.id, data.note)
    
    # TODO Milestone 3: trigger anomaly detection
    # background_tasks.add_task(check_for_anomalies, TEMP_USER_ID, checkin)

    return _serialize_checkin(checkin)


@router.get(
    "/",
    response_model=list[CheckInResponse],
    summary="Get check-in history (paginated)",
)
async def list_checkins(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=30, ge=1, le=100, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve the current user's check-in history, newest first.
    
    Pagination: use `skip` and `limit` to page through results.
    Example: skip=0&limit=30 → first page, skip=30&limit=30 → second page
    """
    TEMP_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

    result = await db.execute(
        select(MoodCheckIn)
        .where(MoodCheckIn.user_id == TEMP_USER_ID)
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
async def get_checkin(checkin_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieve a single check-in by its UUID."""
    TEMP_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

    result = await db.execute(
        select(MoodCheckIn).where(
            MoodCheckIn.id == checkin_id,
            MoodCheckIn.user_id == TEMP_USER_ID,   # users can only see their own data
        )
    )
    checkin = result.scalar_one_or_none()

    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in not found",
        )

    return _serialize_checkin(checkin)
