from fastapi import APIRouter

from newhope_schoolmanagenment.api.deps import (
    CurrentTeacher,
    SessionDep,
)
from newhope_schoolmanagenment.controllers import teacher as teacher_controller
from newhope_schoolmanagenment.schemas import (
    SubmissionGradeUpdate,
    TeacherRead,
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
