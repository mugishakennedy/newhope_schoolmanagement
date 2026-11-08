from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from newhope_schoolmanagenment.core.storage import save_submission_file
from newhope_schoolmanagenment.core.time import utcnow
from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Module,
    Student,
    Submission,
    Teacher,
)
from newhope_schoolmanagenment.schemas.submissions import (
    SubmissionCreate,
    SubmissionUpdate,
)


def _assignment_options() -> tuple:
    return (
        selectinload(Assignment.teacher),
        selectinload(Assignment.module),
        selectinload(Assignment.school_class),
    )


def _ensure_not_quiz(assignment: Assignment) -> None:
    if assignment.kind == "quiz":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assignment is a quiz. Submit it from the quiz screen.",
        )


def _ensure_before_deadline(assignment: Assignment) -> None:
    if assignment.deadline is None:
        return

    deadline = assignment.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=UTC)

    if datetime.now(UTC) > deadline:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The submission deadline has passed",
        )


async def _ensure_not_submitted(
    session: AsyncSession, student: Student, assignment: Assignment
) -> None:
    existing = await session.scalar(
        select(Submission.id).where(
            Submission.assignment_id == assignment.id,
            Submission.student_id == student.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This assignment has already been submitted. Submitted work "
                "is final and cannot be changed."
            ),
        )


async def get_student_class(session: AsyncSession, student: Student) -> Class:
    if student.class_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student is not assigned to a class",
        )

    school_class = await session.get(Class, student.class_id)
    if school_class is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student class not found",
        )
    return school_class


async def list_student_modules(session: AsyncSession, student: Student) -> list[Module]:
    if student.class_id is None:
        return []

    result = await session.execute(
        select(Module)
        .join(
            Assignment,
            Assignment.module_id == Module.id,
        )
        .where(Assignment.class_id == student.class_id)
        .distinct()
        .order_by(Module.module_name, Module.id)
    )
    return list(result.scalars().all())


async def list_student_teachers(
    session: AsyncSession, student: Student
) -> list[Teacher]:
    if student.class_id is None:
        return []

    result = await session.execute(
        select(Teacher)
        .join(
            Assignment,
            Assignment.teacher_id == Teacher.id,
        )
        .where(Assignment.class_id == student.class_id)
        .distinct()
        .order_by(Teacher.full_name, Teacher.id)
    )
    return list(result.scalars().all())


async def list_student_assignments(
    session: AsyncSession, student: Student, module_id: int | None = None
) -> list[Assignment]:
    if student.class_id is None:
        return []

    query = (
        select(Assignment)
        .where(Assignment.class_id == student.class_id)
        .options(*_assignment_options())
        .order_by(Assignment.deadline.asc().nulls_last(), Assignment.id)
    )
    if module_id is not None:
        query = query.where(Assignment.module_id == module_id)

    result = await session.execute(query)
    return list(result.scalars().all())


async def get_student_assignment(
    session: AsyncSession, student: Student, assignment_id: int
) -> Assignment:
    if student.class_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    result = await session.execute(
        select(Assignment)
        .where(
            Assignment.id == assignment_id,
            Assignment.class_id == student.class_id,
        )
        .options(*_assignment_options())
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


async def _upsert_submission(
    session: AsyncSession,
    student: Student,
    assignment: Assignment,
    content_url: str | None,
    answer_text: str | None,
) -> Submission:
    content_url = content_url.strip() if content_url else None
    answer_text = answer_text.strip() if answer_text else None
    if answer_text and len(answer_text) > 20000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer text is too long (maximum 20000 characters)",
        )
    result = await session.execute(
        select(Submission).where(
            Submission.assignment_id == assignment.id,
            Submission.student_id == student.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This assignment has already been submitted. Submitted work "
                "is final and cannot be changed."
            ),
        )

    submission = Submission(
        assignment_id=assignment.id,
        student_id=student.id,
        content_url=content_url,
        answer_text=answer_text,
        submitted_at=utcnow(),
    )
    session.add(submission)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This assignment has already been submitted. Submitted work "
                "is final and cannot be changed."
            ),
        ) from exc

    await session.refresh(submission)
    return submission


async def submit_assignment(
    session: AsyncSession,
    student: Student,
    assignment_id: int,
    data: SubmissionCreate,
) -> Submission:
    assignment = await get_student_assignment(session, student, assignment_id)
    _ensure_not_quiz(assignment)
    _ensure_before_deadline(assignment)
    await _ensure_not_submitted(session, student, assignment)
    return await _upsert_submission(
        session,
        student,
        assignment,
        data.content_url,
        data.answer_text,
    )


async def submit_assignment_file(
    session: AsyncSession,
    student: Student,
    assignment_id: int,
    upload: UploadFile,
    answer_text: str | None = None,
) -> Submission:
    assignment = await get_student_assignment(session, student, assignment_id)
    _ensure_not_quiz(assignment)
    _ensure_before_deadline(assignment)
    await _ensure_not_submitted(session, student, assignment)
    content_url = await save_submission_file(upload)
    return await _upsert_submission(
        session,
        student,
        assignment,
        content_url,
        answer_text,
    )


async def list_student_submissions(
    session: AsyncSession, student: Student
) -> list[Submission]:
    result = await session.execute(
        select(Submission)
        .where(Submission.student_id == student.id)
        .options(selectinload(Submission.assignment).selectinload(Assignment.module))
        .order_by(Submission.submitted_at.desc(), Submission.id)
    )
    return list(result.scalars().all())


async def _get_owned_submission(
    session: AsyncSession, student: Student, submission_id: int
) -> Submission:
    result = await session.execute(
        select(Submission)
        .where(
            Submission.id == submission_id,
            Submission.student_id == student.id,
        )
        .options(selectinload(Submission.assignment).selectinload(Assignment.module))
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    return submission


async def get_student_submission(
    session: AsyncSession, student: Student, submission_id: int
) -> Submission:
    return await _get_owned_submission(session, student, submission_id)


async def update_student_submission(
    session: AsyncSession,
    student: Student,
    submission_id: int,
    data: SubmissionUpdate,
) -> Submission:
    submission = await _get_owned_submission(session, student, submission_id)
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=(
            f"Submission {submission.id} is final. Submitted work cannot be "
            "changed while you wait for a grade."
        ),
    )


async def delete_student_submission(
    session: AsyncSession, student: Student, submission_id: int
) -> None:
    submission = await _get_owned_submission(session, student, submission_id)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            f"Submission {submission.id} cannot be withdrawn. Submitted work "
            "is final."
        ),
    )
