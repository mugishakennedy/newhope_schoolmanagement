from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from newhope_schoolmanagenment.models.base import Base


class Class(Base):
    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint(
            "class_name", "academic_year", name="uq_classes_name_year"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False)

    def __repr__(self) -> str:
        return f"<Class(id={self.id}, name={self.class_name})>"
