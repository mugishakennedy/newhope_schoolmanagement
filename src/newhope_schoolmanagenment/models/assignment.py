from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.classes import Class
    from newhope_schoolmanagenment.models.module import Module
    from newhope_schoolmanagenment.models.submission import Submission
    from newhope_schoolmanagenment.models.teacher import Teacher


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module_id: Mapped[int] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id: Mapped[int] = mapped_column(
        ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    teacher: Mapped[Teacher] = relationship(back_populates="assignments")
    module: Mapped[Module] = relationship(back_populates="assignments")
    school_class: Mapped[Class] = relationship(back_populates="assignments")
    submissions: Mapped[list[Submission]] = relationship(
        back_populates="assignment", cascade="all, delete"
    )

    def __repr__(self) -> str:
        return f"<Assignment(id={self.id}, title={self.title})>"
