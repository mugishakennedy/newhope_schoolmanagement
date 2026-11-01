from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from newhope_schoolmanagenment.api.deps import (
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
from newhope_schoolmanagenment.controllers import student as student_controller
from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.security import decode_token
from newhope_schoolmanagenment.models import Student
from newhope_schoolmanagenment.schemas import (
    MessageResponse,
    StudentRegistrationRead,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


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
    response_model=TokenResponse,
    dependencies=[Depends(refresh_rate_limit)],
)
async def refresh_access_token(
    request: Request, response: Response, session: SessionDep
) -> TokenResponse:
    settings = get_settings()
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    payload = decode_token(refresh_token, "refresh")
    if payload.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    student = await session.get(Student, int(payload["sub"]))
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    token_response, new_refresh_token = issue_token_response(
        student.id, "student"
    )
    set_refresh_cookie(response, new_refresh_token)
    return token_response


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response) -> MessageResponse:
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=StudentRegistrationRead)
async def read_current_student(current_student: CurrentStudent) -> Student:
    return current_student
