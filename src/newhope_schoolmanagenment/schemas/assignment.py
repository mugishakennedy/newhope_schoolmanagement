from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AssignmentCreate(BaseModel):
    teacher_id: int
    module_id: int
    class_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    deadline: datetime | None = None

    @field_validator("deadline")
    @classmethod
    def normalize_deadline(cls, value: datetime | None) -> datetime | None:
        if value is None or value.tzinfo is None:
            return value
        return value.astimezone(UTC).replace(tzinfo=None)


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    module_id: int
    class_id: int
    title: str
    description: str | None
    deadline: datetime | None
    created_at: datetime
