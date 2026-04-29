# backend/app/services/anomaly_detection.py
#
# WHAT IS ANOMALY DETECTION?
# We look at a user's last 30 days of mood data and calculate their
# personal "baseline" (mean + standard deviation).
# When a new check-in comes in, we calculate how far it deviates
# from that baseline using a Z-score.
#
# Z-SCORE FORMULA:
#   z = (current_value - mean) / std_deviation
#
# Interpretation:
#   z = 0    → exactly average (normal)
#   z = -1   → 1 standard deviation below average (slightly low)
#   z = -2   → 2 std devs below average → FLAG THIS (unusual)
#   z = -3   → 3 std devs below average → FLAG AS CRITICAL
#
# EXAMPLE:
#   User's avg mood over 30 days = 3.8, std dev = 0.5
#   Today's mood = 1.5
#   Z-score = (1.5 - 3.8) / 0.5 = -4.6  → CRITICAL anomaly
#
# WHY THIS MATTERS FOR PORTFOLIO:
# This is real ML/statistics used in production monitoring systems.
# It's the same algorithm used by Netflix to detect server anomalies,
# by banks to detect fraud, etc.

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.user import MoodCheckIn, AnomalyAlert, AlertSeverity


# ── Thresholds ────────────────────────────────────────────────────────────────
# How many standard deviations below baseline triggers each alert level
THRESHOLDS = {
    AlertSeverity.LOW: -1.5,
    AlertSeverity.MEDIUM: -2.0,
    AlertSeverity.HIGH: -2.5,
    AlertSeverity.CRITICAL: -3.0,
}

# Minimum check-ins needed before we can calculate a reliable baseline
MIN_CHECKINS_FOR_BASELINE = 7

# How many days to look back for the baseline
BASELINE_WINDOW_DAYS = 30

# How many consecutive low mood days triggers a separate "streak" alert
CONSECUTIVE_LOW_MOOD_THRESHOLD = 3
LOW_MOOD_VALUE = 2  # mood score of 2 or below counts as "low"


async def run_anomaly_detection(
    db: AsyncSession,
    user_id: uuid.UUID,
    new_checkin: MoodCheckIn,
) -> Optional[AnomalyAlert]:
    """
    Main entry point. Called after every check-in submission.
    Runs all detection algorithms and creates an alert if needed.
    Returns the alert if one was created, None otherwise.
    """

    # Get the user's recent check-in history (excluding the current one)
    since = datetime.now(timezone.utc) - timedelta(days=BASELINE_WINDOW_DAYS)
    result = await db.execute(
        select(MoodCheckIn)
        .where(MoodCheckIn.user_id == user_id)
        .where(MoodCheckIn.id != new_checkin.id)  # exclude current checkin
        .where(MoodCheckIn.created_at >= since)
        .order_by(desc(MoodCheckIn.created_at))
    )
    history = result.scalars().all()

    if len(history) < MIN_CHECKINS_FOR_BASELINE:
        # Not enough data yet to establish a baseline — skip
        return None

    # Run detectors in priority order — return on first alert created
    alert = await _detect_zscore_anomaly(db, user_id, new_checkin, history)
    if alert:
        return alert

    alert = await _detect_consecutive_low_mood(db, user_id, new_checkin, history)
    if alert:
        return alert

    return None


async def _detect_zscore_anomaly(
    db: AsyncSession,
    user_id: uuid.UUID,
    new_checkin: MoodCheckIn,
    history: list[MoodCheckIn],
) -> Optional[AnomalyAlert]:
    """
    Z-score detection on mood_score.
    Compares today's mood against the user's personal 30-day baseline.
    """
    # Extract mood scores from history
    historical_moods = np.array([c.mood_score for c in history], dtype=float)

    mean = float(np.mean(historical_moods))
    std = float(np.std(historical_moods))

    # If std is 0 (e.g. all moods were the same), skip — can't divide by zero
    if std < 0.01:
        return None

    z_score = (new_checkin.mood_score - mean) / std

    # Determine severity based on how extreme the z-score is
    severity = None
    if z_score <= THRESHOLDS[AlertSeverity.CRITICAL]:
        severity = AlertSeverity.CRITICAL
    elif z_score <= THRESHOLDS[AlertSeverity.HIGH]:
        severity = AlertSeverity.HIGH
    elif z_score <= THRESHOLDS[AlertSeverity.MEDIUM]:
        severity = AlertSeverity.MEDIUM
    elif z_score <= THRESHOLDS[AlertSeverity.LOW]:
        severity = AlertSeverity.LOW

    if severity is None:
        return None  # mood is within normal range

    # Check if we already created a similar alert today (avoid spam)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.execute(
        select(AnomalyAlert)
        .where(AnomalyAlert.user_id == user_id)
        .where(AnomalyAlert.alert_type == "mood_zscore_anomaly")
        .where(AnomalyAlert.created_at >= today_start)
    )
    if existing.scalar_one_or_none():
        return None  # already alerted today

    description = (
        f"Mood score of {new_checkin.mood_score}/5 is significantly below your "
        f"30-day average of {mean:.1f}/5 "
        f"(Z-score: {z_score:.2f}, {abs(z_score):.1f} standard deviations below baseline)."
    )

    alert = AnomalyAlert(
        user_id=user_id,
        severity=severity,
        alert_type="mood_zscore_anomaly",
        description=description,
        anomaly_score=round(z_score, 3),
    )
    db.add(alert)
    await db.flush()

    return alert


async def _detect_consecutive_low_mood(
    db: AsyncSession,
    user_id: uuid.UUID,
    new_checkin: MoodCheckIn,
    history: list[MoodCheckIn],
) -> Optional[AnomalyAlert]:
    """
    Detects when a user has had N consecutive days of low mood scores.
    This catches gradual decline that Z-score might miss if the baseline
    itself has been drifting down.
    """
    # Take the most recent N check-ins (including current one)
    recent = [new_checkin] + list(history[:CONSECUTIVE_LOW_MOOD_THRESHOLD - 1])

    if len(recent) < CONSECUTIVE_LOW_MOOD_THRESHOLD:
        return None

    all_low = all(c.mood_score <= LOW_MOOD_VALUE for c in recent)

    if not all_low:
        return None

    # Check if we already created a streak alert in the last 2 days
    two_days_ago = datetime.now(timezone.utc) - timedelta(days=2)
    existing = await db.execute(
        select(AnomalyAlert)
        .where(AnomalyAlert.user_id == user_id)
        .where(AnomalyAlert.alert_type == "consecutive_low_mood")
        .where(AnomalyAlert.created_at >= two_days_ago)
    )
    if existing.scalar_one_or_none():
        return None

    avg_recent = sum(c.mood_score for c in recent) / len(recent)

    description = (
        f"{CONSECUTIVE_LOW_MOOD_THRESHOLD} consecutive check-ins with mood score "
        f"≤{LOW_MOOD_VALUE}/5 (average: {avg_recent:.1f}/5). "
        f"This may indicate a sustained period of low mood."
    )

    alert = AnomalyAlert(
        user_id=user_id,
        severity=AlertSeverity.MEDIUM,
        alert_type="consecutive_low_mood",
        description=description,
        anomaly_score=round(-avg_recent, 3),
    )
    db.add(alert)
    await db.flush()

    return alert
