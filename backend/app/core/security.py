# backend/app/core/security.py
#
# This file owns ALL security logic. Centralising it means:
# - One place to audit
# - Easy to swap algorithms later
# - No copy-pasted crypto code scattered across the codebase

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from app.core.config import get_settings

settings = get_settings()

# ── Password Hashing ──────────────────────────────────────────────────────────
# bcrypt is the gold standard for password hashing. It's intentionally SLOW,
# which makes brute-force attacks impractical.
# "deprecated='auto'" means if someone has an old hash algorithm, auto-upgrade it.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Turn a plain text password into a bcrypt hash. Store the hash, NEVER the plain text."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain text password matches the stored hash. Returns True/False."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Tokens ────────────────────────────────────────────────────────────────
# JWTs are self-contained tokens. The server signs them with a secret key.
# The client sends the token on every request. We verify the signature — no DB lookup needed.

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT token.
    
    Args:
        data: Payload to encode (typically {"sub": user_id})
        expires_delta: How long until token expires
    
    Returns:
        Signed JWT string
    """
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),  # issued-at
    })
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    
    Returns the payload dict if valid, None if expired or tampered with.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# ── Field-Level Encryption ────────────────────────────────────────────────────
# Even if someone gets a database dump, encrypted fields are unreadable without the key.
# We encrypt sensitive user data: mood notes, journal entries.
# Fernet = symmetric encryption (same key encrypts and decrypts).

_fernet: Optional[Fernet] = None


def _get_fernet() -> Fernet:
    """Lazily initialise the Fernet cipher (singleton)."""
    global _fernet
    if _fernet is None:
        _fernet = Fernet(settings.ENCRYPTION_KEY.encode())
    return _fernet


def encrypt_field(plaintext: str) -> str:
    """Encrypt a string. Returns base64-encoded ciphertext string."""
    if not plaintext:
        return plaintext
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_field(ciphertext: str) -> str:
    """Decrypt a string encrypted by encrypt_field()."""
    if not ciphertext:
        return ciphertext
    return _get_fernet().decrypt(ciphertext.encode()).decode()
