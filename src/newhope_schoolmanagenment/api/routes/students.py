from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.controllers import student as student_controller
from newhope_schoolmanagenment.core.database import get_session
from newhope_schoolmanagenment.schemas import (
    StudentRegistrationCreate,
    StudentRegistrationRead,
)

router = APIRouter(prefix="/students", tags=["students"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.post(
    "",
    response_model=StudentRegistrationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_student(
    data: StudentRegistrationCreate, session: SessionDep
) -> StudentRegistrationRead:
    return await student_controller.create_student(session, data)
