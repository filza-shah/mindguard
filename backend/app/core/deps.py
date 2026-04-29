# backend/app/core/deps.py
#
# FastAPI "dependencies" — reusable functions injected into route handlers.
# get_current_user is the most important one: it reads the JWT token from
# the request header, validates it, and returns the logged-in User object.
#
# Usage in any router:
#   async def my_route(current_user: User = Depends(get_current_user)):
#       # current_user is now the real authenticated user

import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# HTTPBearer reads the "Authorization: Bearer <token>" header automatically
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate the JWT token and return the current logged-in user.

    This runs on every protected route. If the token is missing, expired,
    or tampered with — the request is rejected with 401 before your
    route handler even runs.
    """
    token = credentials.credentials  # the raw JWT string

    # Decode and verify the token signature
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract the user ID from the "sub" (subject) claim
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Look up the user in the database
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Alias — use this in routes where you want extra clarity."""
    return current_user
