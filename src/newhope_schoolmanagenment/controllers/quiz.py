from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from newhope_schoolmanagenment.models import (
    Assignment,
    QuizAnswer,
    QuizAttempt,
    QuizOption,
    QuizQuestion,
    Student,
    Submission,
)
from newhope_schoolmanagenment.schemas.quiz import QuizAttemptInput, QuizPayload

QUIZ_CONTENT_PREFIX = "quiz://assignment/"


def quiz_content_url(assignment_id: int) -> str:
    return f"{QUIZ_CONTENT_PREFIX}{assignment_id}"


def is_quiz_content_url(value: str | None) -> bool:
    return bool(value and value.startswith(QUIZ_CONTENT_PREFIX))


def _normalize(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _format_points(value: Decimal) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".")


def _ensure_quiz(assignment: Assignment) -> None:
    if assignment.kind != "quiz":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assignment is not a quiz",
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


async def _load_questions(
    session: AsyncSession, assignment_id: int
) -> list[QuizQuestion]:
    result = await session.execute(
        select(QuizQuestion)
        .where(QuizQuestion.assignment_id == assignment_id)
        .options(selectinload(QuizQuestion.options))
        .order_by(QuizQuestion.position, QuizQuestion.id)
    )
    return list(result.scalars().all())


async def list_questions(
    session: AsyncSession, assignment: Assignment
) -> list[QuizQuestion]:
    _ensure_quiz(assignment)
    return await _load_questions(session, assignment.id)


async def replace_quiz(
    session: AsyncSession,
    assignment: Assignment,
    payload: QuizPayload,
) -> list[QuizQuestion]:
    _ensure_quiz(assignment)

    existing_attempt = await session.scalar(
        select(QuizAttempt.id)
        .where(QuizAttempt.assignment_id == assignment.id)
        .limit(1)
    )
    if existing_attempt is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Students have already attempted this quiz, so its questions "
                "can no longer be changed"
            ),
        )

    await session.execute(
        delete(QuizQuestion).where(
            QuizQuestion.assignment_id == assignment.id
        )
    )

    for index, question_data in enumerate(payload.questions, start=1):
        question = QuizQuestion(
            assignment_id=assignment.id,
            position=index,
            prompt=question_data.prompt.strip(),
            kind=question_data.kind,
            correct_answer=(
                question_data.correct_answer.strip()
                if question_data.correct_answer
                else None
            ),
            points=question_data.points,
        )
        session.add(question)
        await session.flush()

        for option_index, option_data in enumerate(
            question_data.options, start=1
        ):
            session.add(
                QuizOption(
                    question_id=question.id,
                    position=option_index,
                    text=option_data.text.strip(),
                    is_correct=option_data.is_correct,
                )
            )

    await session.commit()
    return await _load_questions(session, assignment.id)


async def _load_attempt(
    session: AsyncSession, attempt_id: int
) -> QuizAttempt:
    result = await session.execute(
        select(QuizAttempt)
        .where(QuizAttempt.id == attempt_id)
        .options(selectinload(QuizAttempt.answers))
    )
    attempt = result.scalar_one_or_none()
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found",
        )
    return attempt


async def get_student_attempt(
    session: AsyncSession, student: Student, assignment: Assignment
) -> QuizAttempt:
    result = await session.execute(
        select(QuizAttempt)
        .where(
            QuizAttempt.assignment_id == assignment.id,
            QuizAttempt.student_id == student.id,
        )
        .options(selectinload(QuizAttempt.answers))
    )
    attempt = result.scalar_one_or_none()
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not attempted this quiz yet",
        )
    return attempt


async def get_attempt_for_submission(
    session: AsyncSession, submission: Submission
) -> QuizAttempt:
    result = await session.execute(
        select(QuizAttempt)
        .where(
            QuizAttempt.assignment_id == submission.assignment_id,
            QuizAttempt.student_id == submission.student_id,
        )
        .options(selectinload(QuizAttempt.answers))
    )
    attempt = result.scalar_one_or_none()
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz attempt found for this submission",
        )
    return attempt


async def list_attempts(
    session: AsyncSession, assignment: Assignment
) -> list[QuizAttempt]:
    _ensure_quiz(assignment)
    result = await session.execute(
        select(QuizAttempt)
        .where(QuizAttempt.assignment_id == assignment.id)
        .options(selectinload(QuizAttempt.answers))
        .order_by(QuizAttempt.submitted_at.desc(), QuizAttempt.id)
    )
    return list(result.scalars().all())


async def submit_quiz(
    session: AsyncSession,
    student: Student,
    assignment: Assignment,
    payload: QuizAttemptInput,
) -> QuizAttempt:
    _ensure_quiz(assignment)
    _ensure_before_deadline(assignment)

    questions = await _load_questions(session, assignment.id)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has no questions yet",
        )

    answers_by_question = {
        answer.question_id: answer for answer in payload.answers
    }

    total = Decimal(0)
    max_total = Decimal(0)
    graded: list[tuple[QuizQuestion, int | None, str | None, bool, Decimal]] = []

    for question in questions:
        max_total += question.points
        incoming = answers_by_question.get(question.id)
        selected_option_id: int | None = None
        answer_text: str | None = None
        is_correct = False
        awarded = Decimal(0)

        if question.kind == "multiple_choice":
            raw_option_id = (
                incoming.selected_option_id if incoming is not None else None
            )
            option = next(
                (
                    item
                    for item in question.options
                    if item.id == raw_option_id
                ),
                None,
            )
            if option is not None:
                selected_option_id = option.id
                if option.is_correct:
                    is_correct = True
                    awarded = question.points
        else:
            raw_text = (
                incoming.answer_text if incoming is not None else None
            )
            if raw_text and raw_text.strip():
                answer_text = raw_text.strip()
                expected = question.correct_answer or ""
                if _normalize(answer_text) == _normalize(expected):
                    is_correct = True
                    awarded = question.points

        total += awarded
        graded.append(
            (question, selected_option_id, answer_text, is_correct, awarded)
        )

    grade = (
        (total / max_total * Decimal(100))
        if max_total > 0
        else Decimal(0)
    ).quantize(Decimal("0.01"))
    submitted_at = datetime.now(UTC)
    feedback = (
        "Auto-graded quiz: "
        f"{_format_points(total)}/{_format_points(max_total)}"
    )
    content_url = quiz_content_url(assignment.id)

    submission = await session.scalar(
        select(Submission).where(
            Submission.assignment_id == assignment.id,
            Submission.student_id == student.id,
        )
    )
    if submission is None:
        submission = Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            content_url=content_url,
            grade=grade,
            feedback=feedback,
            submitted_at=submitted_at,
        )
        session.add(submission)
    else:
        submission.content_url = content_url
        submission.grade = grade
        submission.feedback = feedback
        submission.submitted_at = submitted_at
    await session.flush()

    attempt = await session.scalar(
        select(QuizAttempt).where(
            QuizAttempt.assignment_id == assignment.id,
            QuizAttempt.student_id == student.id,
        )
    )
    if attempt is None:
        attempt = QuizAttempt(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_id=submission.id,
            score=total,
            max_score=max_total,
            submitted_at=submitted_at,
        )
        session.add(attempt)
        await session.flush()
    else:
        attempt.submission_id = submission.id
        attempt.score = total
        attempt.max_score = max_total
        attempt.submitted_at = submitted_at
        await session.execute(
            delete(QuizAnswer).where(QuizAnswer.attempt_id == attempt.id)
        )
        await session.flush()

    for (
        question,
        selected_option_id,
        answer_text,
        is_correct,
        awarded,
    ) in graded:
        session.add(
            QuizAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option_id,
                answer_text=answer_text,
                is_correct=is_correct,
                points_awarded=awarded,
            )
        )

    await session.commit()
    return await _load_attempt(session, attempt.id)
