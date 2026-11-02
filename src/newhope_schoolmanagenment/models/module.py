from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignment import Assignment
    from newhope_schoolmanagenment.models.teacher_module import TeacherModule


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    module_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    assignments: Mapped[list[Assignment]] = relationship(
        back_populates="module", cascade="all, delete"
    )
    teacher_modules: Mapped[list[TeacherModule]] = relationship(
        back_populates="module", cascade="all, delete"
    )

    def __repr__(self) -> str:
        return f"<Module(code={self.module_code}, name={self.module_name})>"
