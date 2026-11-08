from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AssignmentKind = Literal["assignment", "quiz"]


def _normalize_deadline(value: datetime | None) -> datetime | None:
    if value is None or value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


class AssignmentCreate(BaseModel):
    teacher_id: int
    module_id: int
    class_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    kind: AssignmentKind = "assignment"
    deadline: datetime | None = None

    @field_validator("deadline")
    @classmethod
    def normalize_deadline(cls, value: datetime | None) -> datetime | None:
        return _normalize_deadline(value)


class AssignmentUpdate(BaseModel):
    teacher_id: int | None = None
    module_id: int | None = None
    class_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    kind: AssignmentKind | None = None
    deadline: datetime | None = None

    @field_validator("deadline")
    @classmethod
    def normalize_deadline(cls, value: datetime | None) -> datetime | None:
        return _normalize_deadline(value)


class TeacherAssignmentCreate(BaseModel):
    module_id: int
    class_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    kind: AssignmentKind = "assignment"
    deadline: datetime | None = None

    @field_validator("deadline")
    @classmethod
    def normalize_deadline(cls, value: datetime | None) -> datetime | None:
        return _normalize_deadline(value)


class TeacherAssignmentUpdate(BaseModel):
    module_id: int | None = None
    class_id: int | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    kind: AssignmentKind | None = None
    deadline: datetime | None = None

    @field_validator("deadline")
    @classmethod
    def normalize_deadline(cls, value: datetime | None) -> datetime | None:
        return _normalize_deadline(value)


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    module_id: int
    class_id: int
    title: str
    description: str | None
    kind: str
    deadline: datetime | None
    created_at: datetime
