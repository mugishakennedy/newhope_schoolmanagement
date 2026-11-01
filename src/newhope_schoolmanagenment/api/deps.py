from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.database import get_session
from newhope_schoolmanagenment.core.rate_limit import rate_limit
from newhope_schoolmanagenment.core.security import (
    decode_token,
    oauth2_dos_scheme,
    oauth2_scheme,
)
from newhope_schoolmanagenment.models import DOS, Student

SessionDep = Annotated[AsyncSession, Depends(get_session)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]
DosTokenDep = Annotated[str, Depends(oauth2_dos_scheme)]

_settings = get_settings()

login_rate_limit = rate_limit(
    _settings.login_rate_limit,
    _settings.rate_limit_window_seconds,
    "auth:login",
)
register_rate_limit = rate_limit(
    _settings.register_rate_limit,
    _settings.rate_limit_window_seconds,
    "auth:register",
)
refresh_rate_limit = rate_limit(
    _settings.login_rate_limit,
    _settings.rate_limit_window_seconds,
    "auth:refresh",
)


async def get_current_student(token: TokenDep, session: SessionDep) -> Student:
    payload = decode_token(token, "access")
    if payload.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    student = await session.get(Student, int(payload["sub"]))
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return student


async def get_current_dos(token: DosTokenDep, session: SessionDep) -> DOS:
    payload = decode_token(token, "access")
    if payload.get("role") != "dos":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="DOS access required",
        )
    dos = await session.get(DOS, int(payload["sub"]))
    if dos is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return dos


CurrentStudent = Annotated[Student, Depends(get_current_student)]
CurrentDOS = Annotated[DOS, Depends(get_current_dos)]
