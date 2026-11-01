from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from newhope_schoolmanagenment.schemas.assignments import AssignmentSummary


class SubmissionCreate(BaseModel):
    content_url: str = Field(min_length=1, max_length=2000)


class SubmissionUpdate(BaseModel):
    content_url: str = Field(min_length=1, max_length=2000)


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    content_url: str
    grade: Decimal | None
    feedback: str | None
    submitted_at: datetime


class SubmissionWithAssignment(SubmissionRead):
    assignment: AssignmentSummary
