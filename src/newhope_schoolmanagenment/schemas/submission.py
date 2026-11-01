from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SubmissionCreate(BaseModel):
    assignment_id: int
    content_url: str = Field(min_length=1)


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    content_url: str
    grade: Decimal | None
    feedback: str | None
    submitted_at: datetime


class SubmissionGradeUpdate(BaseModel):
    grade: Decimal = Field(ge=0, le=100)
    feedback: str | None = None
