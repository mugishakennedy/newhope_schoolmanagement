import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DOSCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=72)


class DOSAccountCreate(BaseModel):
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=10, max_length=72)
    full_name: str | None = Field(default=None, max_length=150)

    @field_validator("password")
    @classmethod
    def password_is_strong(cls, value: str) -> str:
        requirements = {
            "a lowercase letter": r"[a-z]",
            "an uppercase letter": r"[A-Z]",
            "a digit": r"\d",
            "a special character": r"[^A-Za-z0-9]",
        }
        missing = [
            label
            for label, pattern in requirements.items()
            if re.search(pattern, value) is None
        ]
        if missing:
            raise ValueError(
                "Password must contain " + ", ".join(missing)
            )
        return value


class DOSRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    created_at: datetime
