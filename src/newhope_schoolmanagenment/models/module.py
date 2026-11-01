from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from newhope_schoolmanagenment.models.base import Base


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    module_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<Module(code={self.module_code}, name={self.module_name})>"
