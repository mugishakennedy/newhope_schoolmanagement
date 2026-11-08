from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignment import Assignment
    from newhope_schoolmanagenment.models.student_registration import Student
    from newhope_schoolmanagenment.models.submission import Submission


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(
        String(30), nullable=False, default="multiple_choice"
    )
    correct_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    points: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal(1)
    )

    assignment: Mapped[Assignment] = relationship(
        back_populates="quiz_questions"
    )
    options: Mapped[list[QuizOption]] = relationship(
        back_populates="question",
        cascade="all, delete",
        order_by="QuizOption.position",
    )

    def __repr__(self) -> str:
        return f"<QuizQuestion(id={self.id}, kind={self.kind})>"


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    question: Mapped[QuizQuestion] = relationship(back_populates="options")

    def __repr__(self) -> str:
        return f"<QuizOption(id={self.id}, is_correct={self.is_correct})>"


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "student_id",
            name="uq_quiz_attempt_assignment_student",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submission_id: Mapped[int | None] = mapped_column(
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=True,
    )
    score: Mapped[Decimal] = mapped_column(
        Numeric(6, 2), nullable=False, default=Decimal(0)
    )
    max_score: Mapped[Decimal] = mapped_column(
        Numeric(6, 2), nullable=False, default=Decimal(0)
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    assignment: Mapped[Assignment] = relationship(
        back_populates="quiz_attempts"
    )
    student: Mapped[Student] = relationship()
    submission: Mapped[Submission | None] = relationship()
    answers: Mapped[list[QuizAnswer]] = relationship(
        back_populates="attempt",
        cascade="all, delete",
        order_by="QuizAnswer.id",
    )

    def __repr__(self) -> str:
        return f"<QuizAttempt(id={self.id}, score={self.score})>"


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("quiz_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_option_id: Mapped[int | None] = mapped_column(
        ForeignKey("quiz_options.id", ondelete="SET NULL"), nullable=True
    )
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    points_awarded: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal(0)
    )

    attempt: Mapped[QuizAttempt] = relationship(back_populates="answers")

    def __repr__(self) -> str:
        return f"<QuizAnswer(id={self.id}, is_correct={self.is_correct})>"
