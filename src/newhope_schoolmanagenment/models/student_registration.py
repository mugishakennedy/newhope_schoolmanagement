from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from newhope_schoolmanagenment.models.base import Base


class StudentRegistration(Base):
    __tablename__ = "student_registration"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_name: Mapped[str] = mapped_column(String(100), nullable=False)
    student_email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    registration_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    course_id: Mapped[int] = mapped_column(Integer, nullable=False)

    def __repr__(self) -> str:
        return (
            f"<StudentRegistration(name={self.student_name}, "
            f"email={self.student_email}, course_id={self.course_id})>"
        )
