# backend/app/routers/auth.py
#
# A "router" is a group of related API endpoints.
# We split routes into separate files to keep the codebase organised.
# This router handles: /api/v1/auth/register and /api/v1/auth/login

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import get_settings
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    
    - Validates email format and password length (Pydantic does this automatically)
    - Checks for duplicate email/username
    - Hashes the password before storing
    - Returns the new user (without password)
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken",
        )

    # Create the user — NEVER store plain text passwords
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),  # ← bcrypt hash
        display_name=user_data.display_name,
        age=user_data.age,
    )
    db.add(new_user)
    await db.flush()   # writes to DB but doesn't commit yet — we commit in get_db()
    await db.refresh(new_user)  # reload to get auto-generated fields (id, created_at)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT access token",
)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login with email + password.
    
    Returns a JWT token. The client stores this and sends it in the
    Authorization: Bearer <token> header on every subsequent request.
    
    Security note: We return the SAME error message whether the email
    doesn't exist OR the password is wrong. This prevents "user enumeration"
    attacks where an attacker probes which emails are registered.
    """
    # Look up user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    # Use the same generic error for both "user not found" and "wrong password"
    invalid_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        raise invalid_error

    if not verify_password(credentials.password, user.hashed_password):
        raise invalid_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Create JWT token with user ID as the subject claim
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_current_user_profile(
    # TODO: We'll add the auth dependency here in the next milestone
    # current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Placeholder — protected routes with JWT coming in Milestone 2."""
    return {"message": "Auth middleware coming in next step"}
