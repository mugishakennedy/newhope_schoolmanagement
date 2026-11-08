from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignment import Assignment


class AssignmentAttachment(Base):
    __tablename__ = "assignment_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    uploaded_by_teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True
    )
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_url: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    assignment: Mapped[Assignment] = relationship(
        back_populates="attachments"
    )

    def __repr__(self) -> str:
        return (
            f"<AssignmentAttachment(id={self.id}, "
            f"name={self.original_name})>"
        )
