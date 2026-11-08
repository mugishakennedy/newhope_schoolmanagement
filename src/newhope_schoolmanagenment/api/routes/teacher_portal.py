from typing import Annotated

from fastapi import APIRouter, File, UploadFile, status

from newhope_schoolmanagenment.api.deps import (
    CurrentTeacher,
    SessionDep,
)
from newhope_schoolmanagenment.controllers import (
    assignment as assignment_controller,
)
from newhope_schoolmanagenment.controllers import (
    attachment as attachment_controller,
)
from newhope_schoolmanagenment.controllers import quiz as quiz_controller
from newhope_schoolmanagenment.controllers import teacher as teacher_controller
from newhope_schoolmanagenment.schemas import (
    AttachmentRead,
    QuizAttemptRead,
    QuizPayload,
    QuizTeacherRead,
    SubmissionGradeUpdate,
    TeacherAssignmentCreate,
    TeacherAssignmentUpdate,
    TeacherModuleRead,
    TeacherRead,
)
from newhope_schoolmanagenment.schemas.assignment import (
    AssignmentRead as AssignmentRecord,
)
from newhope_schoolmanagenment.schemas.assignments import AssignmentRead
from newhope_schoolmanagenment.schemas.classes import ClassRead
from newhope_schoolmanagenment.schemas.modules import ModuleRead
from newhope_schoolmanagenment.schemas.submissions import SubmissionWithStudent

router = APIRouter(prefix="/teacher", tags=["teacher-portal"])


@router.get("/me", response_model=TeacherRead)
async def read_current_teacher(current_teacher: CurrentTeacher):
    return current_teacher


@router.get("/dashboard")
async def read_teacher_dashboard(
    current_teacher: CurrentTeacher, session: SessionDep
) -> dict[str, int]:
    return await teacher_controller.get_teacher_dashboard(
        session, current_teacher.id
    )


@router.get("/assignments", response_model=list[AssignmentRead])
async def list_teacher_assignments(
    current_teacher: CurrentTeacher, session: SessionDep
):
    return await teacher_controller.list_teacher_assignments(
        session, current_teacher.id
    )


@router.post(
    "/assignments",
    response_model=AssignmentRecord,
    status_code=status.HTTP_201_CREATED,
)
async def create_teacher_assignment(
    data: TeacherAssignmentCreate,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> AssignmentRecord:
    return await assignment_controller.create_teacher_assignment(
        session, current_teacher.id, data
    )


@router.patch(
    "/assignments/{assignment_id}",
    response_model=AssignmentRecord,
)
async def update_teacher_assignment(
    assignment_id: int,
    data: TeacherAssignmentUpdate,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> AssignmentRecord:
    return await assignment_controller.update_teacher_assignment(
        session, current_teacher.id, assignment_id, data
    )


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_teacher_assignment(
    assignment_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> None:
    await assignment_controller.delete_teacher_assignment(
        session, current_teacher.id, assignment_id
    )


@router.get(
    "/assignments/{assignment_id}/attachments",
    response_model=list[AttachmentRead],
)
async def list_teacher_assignment_attachments(
    assignment_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
):
    await assignment_controller.get_teacher_assignment(
        session, current_teacher.id, assignment_id
    )
    return await attachment_controller.list_assignment_attachments(
        session, assignment_id
    )


@router.post(
    "/assignments/{assignment_id}/attachments",
    response_model=AttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_teacher_assignment_attachment(
    assignment_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
    file: Annotated[UploadFile, File()],
):
    await assignment_controller.get_teacher_assignment(
        session, current_teacher.id, assignment_id
    )
    return await attachment_controller.create_assignment_attachment(
        session, assignment_id, current_teacher.id, file
    )


@router.delete(
    "/assignments/{assignment_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_teacher_assignment_attachment(
    assignment_id: int,
    attachment_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> None:
    await assignment_controller.get_teacher_assignment(
        session, current_teacher.id, assignment_id
    )
    await attachment_controller.delete_assignment_attachment(
        session, assignment_id, attachment_id
    )


@router.get(
    "/assignments/{assignment_id}/quiz",
    response_model=QuizTeacherRead,
)
async def read_teacher_quiz(
    assignment_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> QuizTeacherRead:
    assignment = await assignment_controller.get_teacher_assignment(
        session, current_teacher.id, assignment_id
    )
    questions = await quiz_controller.list_questions(session, assignment)
    return QuizTeacherRead(
        assignment_id=assignment.id, questions=questions
    )


@router.put(
    "/assignments/{assignment_id}/quiz",
    response_model=QuizTeacherRead,
)
async def replace_teacher_quiz(
    assignment_id: int,
    data: QuizPayload,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> QuizTeacherRead:
    assignment = await assignment_controller.get_teacher_assignment(
        session, current_teacher.id, assignment_id
    )
    questions = await quiz_controller.replace_quiz(session, assignment, data)
    return QuizTeacherRead(
        assignment_id=assignment.id, questions=questions
    )


@router.get(
    "/assignments/{assignment_id}/quiz/attempts",
    response_model=list[QuizAttemptRead],
)
async def list_teacher_quiz_attempts(
    assignment_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> list[QuizAttemptRead]:
    assignment = await assignment_controller.get_teacher_assignment(
        session, current_teacher.id, assignment_id
    )
    return await quiz_controller.list_attempts(session, assignment)


@router.get("/teaching-links", response_model=list[TeacherModuleRead])
async def list_teacher_teaching_links(
    current_teacher: CurrentTeacher, session: SessionDep
):
    return await teacher_controller.list_teacher_teaching_links(
        session, current_teacher.id
    )


@router.get("/classes", response_model=list[ClassRead])
async def list_teacher_classes(
    current_teacher: CurrentTeacher, session: SessionDep
):
    return await teacher_controller.list_teacher_classes(
        session, current_teacher.id
    )


@router.get("/modules", response_model=list[ModuleRead])
async def list_teacher_modules(
    current_teacher: CurrentTeacher, session: SessionDep
):
    return await teacher_controller.list_teacher_modules(
        session, current_teacher.id
    )


@router.get("/submissions", response_model=list[SubmissionWithStudent])
async def list_teacher_submissions(
    current_teacher: CurrentTeacher,
    session: SessionDep,
    assignment_id: int | None = None,
):
    return await teacher_controller.list_teacher_submissions(
        session, current_teacher.id, assignment_id
    )


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionWithStudent,
)
async def read_teacher_submission(
    submission_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
):
    return await teacher_controller.get_teacher_submission(
        session, current_teacher.id, submission_id
    )


@router.get(
    "/submissions/{submission_id}/quiz",
    response_model=QuizAttemptRead,
)
async def read_teacher_submission_quiz(
    submission_id: int,
    current_teacher: CurrentTeacher,
    session: SessionDep,
) -> QuizAttemptRead:
    submission = await teacher_controller.get_teacher_submission(
        session, current_teacher.id, submission_id
    )
    return await quiz_controller.get_attempt_for_submission(
        session, submission
    )


@router.patch(
    "/submissions/{submission_id}/grade",
    response_model=SubmissionWithStudent,
)
async def grade_teacher_submission(
    submission_id: int,
    data: SubmissionGradeUpdate,
    current_teacher: CurrentTeacher,
    session: SessionDep,
):
    return await teacher_controller.grade_teacher_submission(
        session, current_teacher.id, submission_id, data
    )
