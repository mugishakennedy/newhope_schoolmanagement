from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignment import Assignment
    from newhope_schoolmanagenment.models.teacher_module import TeacherModule


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(150), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    employee_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    assignments: Mapped[list[Assignment]] = relationship(
        back_populates="teacher", cascade="all, delete"
    )
    teacher_modules: Mapped[list[TeacherModule]] = relationship(
        back_populates="teacher", cascade="all, delete"
    )

    def __repr__(self) -> str:
        return f"<Teacher(code={self.employee_code}, email={self.email})>"
