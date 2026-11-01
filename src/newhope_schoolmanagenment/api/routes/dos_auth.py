from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from newhope_schoolmanagenment.api.deps import (
    CurrentDOS,
    SessionDep,
    login_rate_limit,
    refresh_rate_limit,
    register_rate_limit,
)
from newhope_schoolmanagenment.api.tokens import (
    clear_refresh_cookie,
    issue_token_response,
    set_refresh_cookie,
)
from newhope_schoolmanagenment.controllers import dos as dos_controller
from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.security import decode_token
from newhope_schoolmanagenment.models import DOS
from newhope_schoolmanagenment.schemas import (
    DOSCreate,
    DOSRead,
    MessageResponse,
    TokenResponse,
)

router = APIRouter(prefix="/dos/auth", tags=["dos-auth"])

_settings = get_settings()


@router.post(
    "/token",
    response_model=TokenResponse,
    dependencies=[Depends(login_rate_limit)],
)
async def issue_dos_token(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
) -> TokenResponse:
    dos = await dos_controller.authenticate_dos(
        session, form_data.username, form_data.password
    )
    token_response, refresh_token = issue_token_response(dos.id, "dos")
    set_refresh_cookie(
        response,
        refresh_token,
        cookie_name=_settings.dos_refresh_cookie_name,
        cookie_path=_settings.dos_refresh_cookie_path,
    )
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(refresh_rate_limit)],
)
async def refresh_dos_token(
    request: Request, response: Response, session: SessionDep
) -> TokenResponse:
    refresh_token = request.cookies.get(_settings.dos_refresh_cookie_name)
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    payload = decode_token(refresh_token, "refresh")
    if payload.get("role") != "dos":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    dos = await session.get(DOS, int(payload["sub"]))
    if dos is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    token_response, new_refresh_token = issue_token_response(dos.id, "dos")
    set_refresh_cookie(
        response,
        new_refresh_token,
        cookie_name=_settings.dos_refresh_cookie_name,
        cookie_path=_settings.dos_refresh_cookie_path,
    )
    return token_response


@router.post("/logout", response_model=MessageResponse)
async def logout_dos(response: Response) -> MessageResponse:
    clear_refresh_cookie(
        response,
        cookie_name=_settings.dos_refresh_cookie_name,
        cookie_path=_settings.dos_refresh_cookie_path,
    )
    return MessageResponse(message="Logged out successfully")


@router.post(
    "/bootstrap",
    response_model=DOSRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(register_rate_limit)],
)
async def bootstrap_dos(data: DOSCreate, session: SessionDep) -> DOSRead:
    return await dos_controller.bootstrap_dos(session, data)


@router.get("/me", response_model=DOSRead)
async def read_current_dos(current_dos: CurrentDOS) -> DOS:
    return current_dos
