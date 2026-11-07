from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import student as student_controller
from newhope_schoolmanagenment.schemas import (
    StudentRegistrationRead,
    StudentUpdate,
)

router = APIRouter(prefix="/dos/students", tags=["dos-students"])


@router.get("", response_model=list[StudentRegistrationRead])
async def list_students(
    current_dos: CurrentDOS, session: SessionDep
) -> list[StudentRegistrationRead]:
    return await student_controller.list_students(session)


@router.get("/{student_id}", response_model=StudentRegistrationRead)
async def get_student(
    student_id: int, current_dos: CurrentDOS, session: SessionDep
) -> StudentRegistrationRead:
    return await student_controller.get_student(session, student_id)


@router.patch("/{student_id}", response_model=StudentRegistrationRead)
async def update_student(
    student_id: int,
    data: StudentUpdate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> StudentRegistrationRead:
    return await student_controller.update_student(session, student_id, data)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int, current_dos: CurrentDOS, session: SessionDep
) -> None:
    await student_controller.delete_student(session, student_id)
