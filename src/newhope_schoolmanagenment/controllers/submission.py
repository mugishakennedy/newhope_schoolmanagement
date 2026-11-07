from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.storage import delete_uploaded_file
from newhope_schoolmanagenment.models import Submission
from newhope_schoolmanagenment.schemas import SubmissionGradeUpdate


async def list_submissions(
    session: AsyncSession,
    assignment_id: int | None = None,
) -> list[Submission]:
    stmt = select(Submission).order_by(Submission.id)
    if assignment_id is not None:
        stmt = stmt.where(Submission.assignment_id == assignment_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_submission(
    session: AsyncSession, submission_id: int
) -> Submission:
    submission = await session.get(Submission, submission_id)
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    return submission


async def grade_submission(
    session: AsyncSession,
    submission_id: int,
    data: SubmissionGradeUpdate,
) -> Submission:
    submission = await get_submission(session, submission_id)
    submission.grade = data.grade
    submission.feedback = data.feedback
    await session.commit()
    await session.refresh(submission)
    return submission


async def delete_submission(
    session: AsyncSession, submission_id: int
) -> None:
    submission = await get_submission(session, submission_id)
    content_url = submission.content_url
    await session.execute(
        delete(Submission).where(Submission.id == submission_id)
    )
    await session.commit()
    delete_uploaded_file(content_url)
