from fastapi import Response

from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.security import (
    access_token_expires_in,
    create_access_token,
    create_refresh_token,
    refresh_token_expires_in,
)
from newhope_schoolmanagenment.schemas import TokenResponse


def issue_token_response(user_id: int, role: str) -> tuple[TokenResponse, str]:
    refresh_token = create_refresh_token(user_id, role)
    token_response = TokenResponse(
        access_token=create_access_token(user_id, role),
        expires_in=access_token_expires_in(),
        refresh_expires_in=refresh_token_expires_in(),
    )
    return token_response, refresh_token


def set_refresh_cookie(
    response: Response,
    refresh_token: str,
    cookie_name: str | None = None,
    cookie_path: str | None = None,
) -> None:
    settings = get_settings()
    response.set_cookie(
        key=cookie_name or settings.refresh_cookie_name,
        value=refresh_token,
        max_age=refresh_token_expires_in(),
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path=cookie_path or settings.refresh_cookie_path,
    )


def clear_refresh_cookie(
    response: Response,
    cookie_name: str | None = None,
    cookie_path: str | None = None,
) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=cookie_name or settings.refresh_cookie_name,
        path=cookie_path or settings.refresh_cookie_path,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_samesite,
    )
