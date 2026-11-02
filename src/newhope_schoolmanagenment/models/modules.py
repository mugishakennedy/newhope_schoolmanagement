from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from newhope_schoolmanagenment.models.base import Base

if TYPE_CHECKING:
    from newhope_schoolmanagenment.models.assignments import Assignment


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    module_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    module_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    assignments: Mapped[list[Assignment]] = relationship(
        back_populates="module", cascade="all, delete"
    )

    def __repr__(self) -> str:
        return f"<Module(code={self.module_code}, name={self.module_name})>"
