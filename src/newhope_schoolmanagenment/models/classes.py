from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignments import Assignment
    from newhope_schoolmanagenment.models.student_registration import Student


class Class(Base):
    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint(
            "class_name",
            "academic_year",
            name="uq_classes_class_name_academic_year",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)

    students: Mapped[list[Student]] = relationship(back_populates="school_class")
    assignments: Mapped[list[Assignment]] = relationship(
        back_populates="school_class", cascade="all, delete"
    )

    def __repr__(self) -> str:
        return f"<Class(id={self.id}, name={self.class_name})>"
