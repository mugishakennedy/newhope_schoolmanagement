from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.database import get_session
from newhope_schoolmanagenment.core.rate_limit import rate_limit
from newhope_schoolmanagenment.core.security import decode_token, oauth2_scheme
from newhope_schoolmanagenment.models import Student

SessionDep = Annotated[AsyncSession, Depends(get_session)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

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
    student_id = decode_token(token, "access")
    student = await session.get(Student, student_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return student


CurrentStudent = Annotated[Student, Depends(get_current_student)]
