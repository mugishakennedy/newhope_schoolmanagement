from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile, status

from newhope_schoolmanagenment.api.deps import CurrentStudent, SessionDep
from newhope_schoolmanagenment.controllers import (
    attachment as attachment_controller,
)
from newhope_schoolmanagenment.controllers import quiz as quiz_controller
from newhope_schoolmanagenment.controllers import student_portal as portal
from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Module,
    Submission,
    Teacher,
)
from newhope_schoolmanagenment.schemas import AttachmentRead
from newhope_schoolmanagenment.schemas.assignments import (
    AssignmentRead as AssignmentDetail,
)
from newhope_schoolmanagenment.schemas.classes import ClassRead
from newhope_schoolmanagenment.schemas.modules import ModuleRead
from newhope_schoolmanagenment.schemas.quiz import (
    QuizAttemptInput,
    QuizAttemptRead,
    QuizRead,
)
from newhope_schoolmanagenment.schemas.submissions import (
    SubmissionCreate,
    SubmissionRead,
    SubmissionUpdate,
    SubmissionWithAssignment,
)
from newhope_schoolmanagenment.schemas.teachers import TeacherRead

router = APIRouter(prefix="/students/me", tags=["student portal"])


@router.get("/class", response_model=ClassRead)
async def read_student_class(
    current_student: CurrentStudent, session: SessionDep
) -> Class:
    return await portal.get_student_class(session, current_student)


@router.get("/modules", response_model=list[ModuleRead])
async def list_student_modules(
    current_student: CurrentStudent, session: SessionDep
) -> list[Module]:
    return await portal.list_student_modules(session, current_student)


@router.get("/teachers", response_model=list[TeacherRead])
async def list_student_teachers(
    current_student: CurrentStudent, session: SessionDep
) -> list[Teacher]:
    return await portal.list_student_teachers(session, current_student)


@router.get("/assignments", response_model=list[AssignmentDetail])
async def list_student_assignments(
    current_student: CurrentStudent,
    session: SessionDep,
    module_id: Annotated[int | None, Query(gt=0)] = None,
) -> list[Assignment]:
    return await portal.list_student_assignments(
        session, current_student, module_id
    )


@router.get(
    "/assignments/{assignment_id}",
    response_model=AssignmentDetail,
)
async def read_student_assignment(
    assignment_id: int, current_student: CurrentStudent, session: SessionDep
) -> Assignment:
    return await portal.get_student_assignment(
        session, current_student, assignment_id
    )


@router.get(
    "/assignments/{assignment_id}/quiz",
    response_model=QuizRead,
)
async def read_student_quiz(
    assignment_id: int, current_student: CurrentStudent, session: SessionDep
) -> QuizRead:
    assignment = await portal.get_student_assignment(
        session, current_student, assignment_id
    )
    questions = await quiz_controller.list_questions(session, assignment)
    return QuizRead(assignment_id=assignment.id, questions=questions)


@router.get(
    "/assignments/{assignment_id}/quiz/attempt",
    response_model=QuizAttemptRead,
)
async def read_student_quiz_attempt(
    assignment_id: int, current_student: CurrentStudent, session: SessionDep
) -> QuizAttemptRead:
    assignment = await portal.get_student_assignment(
        session, current_student, assignment_id
    )
    return await quiz_controller.get_student_attempt(
        session, current_student, assignment
    )


@router.post(
    "/assignments/{assignment_id}/quiz/attempts",
    response_model=QuizAttemptRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_student_quiz(
    assignment_id: int,
    data: QuizAttemptInput,
    current_student: CurrentStudent,
    session: SessionDep,
) -> QuizAttemptRead:
    assignment = await portal.get_student_assignment(
        session, current_student, assignment_id
    )
    return await quiz_controller.submit_quiz(
        session, current_student, assignment, data
    )


@router.get(
    "/assignments/{assignment_id}/attachments",
    response_model=list[AttachmentRead],
)
async def list_student_assignment_attachments(
    assignment_id: int,
    current_student: CurrentStudent,
    session: SessionDep,
):
    await portal.get_student_assignment(
        session, current_student, assignment_id
    )
    return await attachment_controller.list_assignment_attachments(
        session, assignment_id
    )


@router.post(
    "/assignments/{assignment_id}/submissions",
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_assignment(
    assignment_id: int,
    data: SubmissionCreate,
    current_student: CurrentStudent,
    session: SessionDep,
) -> Submission:
    return await portal.submit_assignment(
        session, current_student, assignment_id, data
    )


@router.post(
    "/assignments/{assignment_id}/submissions/upload",
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_assignment_submission(
    assignment_id: int,
    current_student: CurrentStudent,
    session: SessionDep,
    file: Annotated[UploadFile, File()],
) -> Submission:
    return await portal.submit_assignment_file(
        session, current_student, assignment_id, file
    )


@router.get(
    "/submissions",
    response_model=list[SubmissionWithAssignment],
)
async def list_student_submissions(
    current_student: CurrentStudent, session: SessionDep
) -> list[Submission]:
    return await portal.list_student_submissions(
        session, current_student
    )


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionWithAssignment,
)
async def read_student_submission(
    submission_id: int, current_student: CurrentStudent, session: SessionDep
) -> Submission:
    return await portal.get_student_submission(
        session, current_student, submission_id
    )


@router.patch(
    "/submissions/{submission_id}",
    response_model=SubmissionRead,
)
async def update_student_submission(
    submission_id: int,
    data: SubmissionUpdate,
    current_student: CurrentStudent,
    session: SessionDep,
) -> Submission:
    return await portal.update_student_submission(
        session, current_student, submission_id, data
    )


@router.delete(
    "/submissions/{submission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_student_submission(
    submission_id: int,
    current_student: CurrentStudent,
    session: SessionDep,
) -> None:
    await portal.delete_student_submission(
        session, current_student, submission_id
    )
