from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.classes import Class
    from newhope_schoolmanagenment.models.module import Module
    from newhope_schoolmanagenment.models.teacher import Teacher


class TeacherModule(Base):
    __tablename__ = "teacher_modules"
    __table_args__ = (
        UniqueConstraint(
            "teacher_id",
            "module_id",
            "class_id",
            name="uq_teacher_module_class",
        ),
    )

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

    teacher: Mapped[Teacher] = relationship(back_populates="teacher_modules")
    module: Mapped[Module] = relationship(back_populates="teacher_modules")
    school_class: Mapped[Class] = relationship(back_populates="teacher_modules")
