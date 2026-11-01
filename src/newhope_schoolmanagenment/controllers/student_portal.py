from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Module,
    Student,
    Submission,
    Teacher,
)
from newhope_schoolmanagenment.schemas import SubmissionCreate, SubmissionUpdate


def _assignment_options() -> tuple:
    return (
        selectinload(Assignment.teacher),
        selectinload(Assignment.module),
        selectinload(Assignment.school_class),
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


async def submit_assignment(
    session: AsyncSession,
    student: Student,
    assignment_id: int,
    data: SubmissionCreate,
) -> Submission:
    assignment = await get_student_assignment(session, student, assignment_id)
    _ensure_before_deadline(assignment)

    result = await session.execute(
        select(Submission).where(
            Submission.assignment_id == assignment.id,
            Submission.student_id == student.id,
        )
    )
    submission = result.scalar_one_or_none()

    if submission is None:
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content_url=data.content_url,
            submitted_at=datetime.now(UTC),
        )
        session.add(submission)
    else:
        submission.content_url = data.content_url
        submission.submitted_at = datetime.now(UTC)
        submission.grade = None
        submission.feedback = None

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission already exists for this assignment",
        ) from exc

    await session.refresh(submission)
    return submission


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
    _ensure_before_deadline(submission.assignment)

    submission.content_url = data.content_url
    submission.submitted_at = datetime.now(UTC)
    submission.grade = None
    submission.feedback = None

    await session.commit()
    await session.refresh(submission)
    return submission
