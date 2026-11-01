from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.controllers import student as student_controller
from newhope_schoolmanagenment.core.database import get_session
from newhope_schoolmanagenment.schemas import (
    StudentLoginRequest,
    StudentLoginResponse,
    StudentRegistrationCreate,
    StudentRegistrationRead,
)

router = APIRouter(prefix="/students", tags=["students"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.post(
    "/register",
    response_model=StudentRegistrationRead,
    status_code=status.HTTP_201_CREATED,
)
async def register_student(
    data: StudentRegistrationCreate, session: SessionDep
) -> StudentRegistrationRead:
    return await student_controller.create_student(session, data)


@router.post("/login", response_model=StudentLoginResponse)
async def login_student(
    data: StudentLoginRequest, session: SessionDep
) -> StudentLoginResponse:
    student = await student_controller.login_student(session, data)
    return StudentLoginResponse(message="Login successful", student=student)


@router.get("", response_model=list[StudentRegistrationRead])
async def list_students(session: SessionDep) -> list[StudentRegistrationRead]:
    return await student_controller.list_students(session)


@router.get("/{student_id}", response_model=StudentRegistrationRead)
async def get_student(
    student_id: int, session: SessionDep
) -> StudentRegistrationRead:
    return await student_controller.get_student(session, student_id)
