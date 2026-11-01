from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import uuid4

import jwt
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from pwdlib.exceptions import PwdlibError
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from newhope_schoolmanagenment.core.config import get_settings

TokenType = Literal["access", "refresh"]

_password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))

student_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> tuple[bool, str | None]:
    try:
        return _password_hash.verify_and_update(password, password_hash)
    except PwdlibError, ValueError:
        return False, None


def _create_token(
    subject_id: int,
    token_type: TokenType,
    expires_delta: timedelta,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject_id),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject_id: int) -> str:
    settings = get_settings()
    return _create_token(
        subject_id,
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(subject_id: int) -> str:
    settings = get_settings()
    return _create_token(
        subject_id,
        "refresh",
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: TokenType) -> int:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise _credentials_exception from exc

    if payload.get("type") != expected_type:
        raise _credentials_exception

    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise _credentials_exception from exc


def access_token_expires_in() -> int:
    return get_settings().access_token_expire_minutes * 60


def refresh_token_expires_in() -> int:
    return get_settings().refresh_token_expire_days * 24 * 60 * 60
