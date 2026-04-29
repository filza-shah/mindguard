# backend/app/routers/alerts.py
#
# Endpoints for viewing and managing anomaly alerts.
# These are the alerts created by the anomaly detection engine.

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import AnomalyAlert, User
from app.schemas.user import AnomalyAlertResponse

router = APIRouter(prefix="/alerts", tags=["Anomaly Alerts"])


@router.get(
    "/",
    response_model=list[AnomalyAlertResponse],
    summary="Get all anomaly alerts for current user",
)
async def list_alerts(
    unacknowledged_only: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns anomaly alerts for the logged-in user, newest first.
    Set unacknowledged_only=true to see only unread alerts.
    """
    query = (
        select(AnomalyAlert)
        .where(AnomalyAlert.user_id == current_user.id)
        .order_by(desc(AnomalyAlert.created_at))
        .offset(skip)
        .limit(limit)
    )

    if unacknowledged_only:
        query = query.where(AnomalyAlert.acknowledged == False)

    result = await db.execute(query)
    return result.scalars().all()


@router.patch(
    "/{alert_id}/acknowledge",
    response_model=AnomalyAlertResponse,
    summary="Acknowledge an alert",
)
async def acknowledge_alert(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark an alert as acknowledged.
    Used by guardians/counsellors to indicate they've seen and acted on it.
    """
    result = await db.execute(
        select(AnomalyAlert).where(
            AnomalyAlert.id == alert_id,
            AnomalyAlert.user_id == current_user.id,
        )
    )
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.acknowledged = True
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(alert)

    return alert
