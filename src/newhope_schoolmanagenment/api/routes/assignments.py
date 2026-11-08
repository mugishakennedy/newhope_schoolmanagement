from typing import Annotated

from fastapi import APIRouter, File, UploadFile, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import (
    assignment as assignment_controller,
)
from newhope_schoolmanagenment.controllers import (
    attachment as attachment_controller,
)
from newhope_schoolmanagenment.controllers import quiz as quiz_controller
from newhope_schoolmanagenment.schemas import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    AttachmentRead,
    QuizPayload,
    QuizTeacherRead,
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


@router.patch("/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> AssignmentRead:
    return await assignment_controller.update_assignment(
        session, assignment_id, data
    )


@router.get(
    "/{assignment_id}/attachments",
    response_model=list[AttachmentRead],
)
async def list_assignment_attachments(
    assignment_id: int, current_dos: CurrentDOS, session: SessionDep
):
    await assignment_controller.get_assignment(session, assignment_id)
    return await attachment_controller.list_assignment_attachments(
        session, assignment_id
    )


@router.post(
    "/{assignment_id}/attachments",
    response_model=AttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_assignment_attachment(
    assignment_id: int,
    current_dos: CurrentDOS,
    session: SessionDep,
    file: Annotated[UploadFile, File()],
):
    await assignment_controller.get_assignment(session, assignment_id)
    return await attachment_controller.create_assignment_attachment(
        session, assignment_id, None, file
    )


@router.delete(
    "/{assignment_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_assignment_attachment(
    assignment_id: int,
    attachment_id: int,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> None:
    await assignment_controller.get_assignment(session, assignment_id)
    await attachment_controller.delete_assignment_attachment(
        session, assignment_id, attachment_id
    )


@router.get(
    "/{assignment_id}/quiz",
    response_model=QuizTeacherRead,
)
async def read_assignment_quiz(
    assignment_id: int, current_dos: CurrentDOS, session: SessionDep
) -> QuizTeacherRead:
    assignment = await assignment_controller.get_assignment(
        session, assignment_id
    )
    questions = await quiz_controller.list_questions(session, assignment)
    return QuizTeacherRead(
        assignment_id=assignment.id, questions=questions
    )


@router.put(
    "/{assignment_id}/quiz",
    response_model=QuizTeacherRead,
)
async def replace_assignment_quiz(
    assignment_id: int,
    data: QuizPayload,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> QuizTeacherRead:
    assignment = await assignment_controller.get_assignment(
        session, assignment_id
    )
    questions = await quiz_controller.replace_quiz(session, assignment, data)
    return QuizTeacherRead(
        assignment_id=assignment.id, questions=questions
    )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: int, current_dos: CurrentDOS, session: SessionDep
) -> None:
    await assignment_controller.delete_assignment(session, assignment_id)
