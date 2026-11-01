from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import (
    assignment as assignment_controller,
)
from newhope_schoolmanagenment.schemas import (
    AssignmentCreate,
    AssignmentRead,
)

router = APIRouter(prefix="/dos/assignments", tags=["dos-assignments"])


@router.post(
    "",
    response_model=AssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    data: AssignmentCreate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> AssignmentRead:
    return await assignment_controller.create_assignment(session, data)


@router.get("", response_model=list[AssignmentRead])
async def list_assignments(
    current_dos: CurrentDOS,
    session: SessionDep,
    class_id: int | None = None,
    teacher_id: int | None = None,
    module_id: int | None = None,
) -> list[AssignmentRead]:
    return await assignment_controller.list_assignments(
        session,
        class_id=class_id,
        teacher_id=teacher_id,
        module_id=module_id,
    )


@router.get("/{assignment_id}", response_model=AssignmentRead)
async def get_assignment(
    assignment_id: int, current_dos: CurrentDOS, session: SessionDep
) -> AssignmentRead:
    return await assignment_controller.get_assignment(
        session, assignment_id
    )
