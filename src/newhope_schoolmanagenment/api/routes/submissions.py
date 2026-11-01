from fastapi import APIRouter

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import (
    submission as submission_controller,
)
from newhope_schoolmanagenment.schemas import (
    SubmissionGradeUpdate,
    SubmissionRead,
)

router = APIRouter(prefix="/dos/submissions", tags=["dos-submissions"])


@router.get("", response_model=list[SubmissionRead])
async def list_submissions(
    current_dos: CurrentDOS,
    session: SessionDep,
    assignment_id: int | None = None,
) -> list[SubmissionRead]:
    return await submission_controller.list_submissions(
        session, assignment_id=assignment_id
    )


@router.get("/{submission_id}", response_model=SubmissionRead)
async def get_submission(
    submission_id: int, current_dos: CurrentDOS, session: SessionDep
) -> SubmissionRead:
    return await submission_controller.get_submission(
        session, submission_id
    )


@router.patch("/{submission_id}/grade", response_model=SubmissionRead)
async def grade_submission(
    submission_id: int,
    data: SubmissionGradeUpdate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> SubmissionRead:
    return await submission_controller.grade_submission(
        session, submission_id, data
    )
