from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import teacher as teacher_controller
from newhope_schoolmanagenment.schemas import (
    TeacherCreate,
    TeacherModuleAssign,
    TeacherModuleRead,
    TeacherRead,
)

router = APIRouter(prefix="/dos/teachers", tags=["dos-teachers"])


@router.post(
    "",
    response_model=TeacherRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_teacher(
    data: TeacherCreate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> TeacherRead:
    return await teacher_controller.create_teacher(session, data)


@router.get("", response_model=list[TeacherRead])
async def list_teachers(
    current_dos: CurrentDOS, session: SessionDep
) -> list[TeacherRead]:
    return await teacher_controller.list_teachers(session)


@router.get("/{teacher_id}", response_model=TeacherRead)
async def get_teacher(
    teacher_id: int, current_dos: CurrentDOS, session: SessionDep
) -> TeacherRead:
    return await teacher_controller.get_teacher(session, teacher_id)


@router.post(
    "/{teacher_id}/modules",
    response_model=TeacherModuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def assign_module(
    teacher_id: int,
    data: TeacherModuleAssign,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> TeacherModuleRead:
    return await teacher_controller.assign_module(
        session, teacher_id, data
    )
