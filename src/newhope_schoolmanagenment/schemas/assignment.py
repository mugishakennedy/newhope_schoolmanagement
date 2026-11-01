from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AssignmentCreate(BaseModel):
    teacher_id: int
    module_id: int
    class_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    deadline: datetime | None = None


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
