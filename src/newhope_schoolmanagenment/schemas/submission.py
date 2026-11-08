from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SubmissionCreate(BaseModel):
    assignment_id: int
    content_url: str | None = Field(default=None, max_length=2000)
    answer_text: str | None = Field(default=None, max_length=20000)


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    content_url: str | None
    answer_text: str | None
    grade: Decimal | None
    feedback: str | None
    submitted_at: datetime


class SubmissionGradeUpdate(BaseModel):
    grade: Decimal = Field(ge=0, le=100)
    feedback: str | None = None
