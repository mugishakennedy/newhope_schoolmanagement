from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from newhope_schoolmanagenment.api.deps import (
    CurrentAccount,
    CurrentStudent,
    SessionDep,
    login_rate_limit,
    refresh_rate_limit,
)
from newhope_schoolmanagenment.api.tokens import (
    clear_refresh_cookie,
    issue_token_response,
    set_refresh_cookie,
)
from newhope_schoolmanagenment.controllers import auth as auth_controller
from newhope_schoolmanagenment.controllers import student as student_controller
from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.security import decode_token
from newhope_schoolmanagenment.models import Student
from newhope_schoolmanagenment.schemas import (
    MessageResponse,
    StudentRegistrationRead,
    TokenResponse,
)
from newhope_schoolmanagenment.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SessionResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    dependencies=[Depends(login_rate_limit)],
)
async def login(
    data: LoginRequest, response: Response, session: SessionDep
) -> LoginResponse:
    role, account = await auth_controller.authenticate(
        session, data.identifier, data.password
    )
    token_response, refresh_token = issue_token_response(account.id, role)
    set_refresh_cookie(response, refresh_token)
    return LoginResponse(
        **token_response.model_dump(),
        role=role,
        user=auth_controller.build_session_user(role, account),
    )


@router.post(
    "/token",
    response_model=TokenResponse,
    dependencies=[Depends(login_rate_limit)],
)
async def issue_access_token(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
) -> TokenResponse:
    student = await student_controller.authenticate_student(
        session, form_data.username, form_data.password
    )
    token_response, refresh_token = issue_token_response(student.id, "student")
    set_refresh_cookie(response, refresh_token)
    return token_response


@router.post(
    "/refresh",
    response_model=LoginResponse,
    dependencies=[Depends(refresh_rate_limit)],
)
async def refresh_access_token(
    request: Request, response: Response, session: SessionDep
) -> LoginResponse:
    settings = get_settings()
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    payload = decode_token(refresh_token, "refresh")
    role = payload.get("role")
    if role not in {"student", "teacher", "dos"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    account = await auth_controller.get_account(
        session, role, int(payload["sub"])
    )
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    token_response, new_refresh_token = issue_token_response(
        account.id, role
    )
    set_refresh_cookie(response, new_refresh_token)
    return LoginResponse(
        **token_response.model_dump(),
        role=role,
        user=auth_controller.build_session_user(role, account),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response) -> MessageResponse:
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully")


@router.get("/session", response_model=SessionResponse)
async def read_session(current_account: CurrentAccount) -> SessionResponse:
    return SessionResponse(
        role=current_account.role,
        user=current_account,
    )


@router.get("/me", response_model=StudentRegistrationRead)
async def read_current_student(current_student: CurrentStudent) -> Student:
    return current_student
