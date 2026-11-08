from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from newhope_schoolmanagenment.schemas.assignments import AssignmentSummary
from newhope_schoolmanagenment.schemas.student_registration import StudentSummary


class _SubmissionContent(BaseModel):
    content_url: str | None = Field(default=None, max_length=2000)
    answer_text: str | None = Field(default=None, max_length=20000)

    @model_validator(mode="after")
    def _require_some_content(self) -> _SubmissionContent:
        has_url = bool(self.content_url and self.content_url.strip())
        has_answer = bool(self.answer_text and self.answer_text.strip())
        if not has_url and not has_answer:
            raise ValueError(
                "Provide a written answer, a file upload, or a link to your work"
            )
        return self


class SubmissionCreate(_SubmissionContent):
    pass


class SubmissionUpdate(_SubmissionContent):
    pass


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


class SubmissionWithAssignment(SubmissionRead):
    assignment: AssignmentSummary


class SubmissionWithStudent(SubmissionRead):
    assignment: AssignmentSummary
    student: StudentSummary
