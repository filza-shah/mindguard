# backend/app/routers/checkins.py

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import encrypt_field, decrypt_field
from app.core.deps import get_current_user
from app.models.user import MoodCheckIn, User
from app.schemas.user import CheckInCreate, CheckInResponse

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


@router.post(
    "/",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a daily mood check-in",
)
async def create_checkin(
    data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← REAL AUTH now
):
    encrypted_note = encrypt_field(data.note) if data.note else None

    checkin = MoodCheckIn(
        user_id=current_user.id,   # ← uses the real logged-in user
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
