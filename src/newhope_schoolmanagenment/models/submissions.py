from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignments import Assignment
    from newhope_schoolmanagenment.models.student_registration import Student


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "student_id",
            name="uq_submissions_assignment_student",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    content_url: Mapped[str] = mapped_column(Text, nullable=False)
    grade: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assignment: Mapped[Assignment] = relationship(back_populates="submissions")
    student: Mapped[Student] = relationship(back_populates="submissions")

    def __repr__(self) -> str:
        return (
            f"<Submission(id={self.id}, assignment_id={self.assignment_id}, "
            f"student_id={self.student_id})>"
        )
