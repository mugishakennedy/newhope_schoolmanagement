from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field


class StudentRegistrationCreate(BaseModel):
    student_name: str = Field(min_length=1, max_length=100)
    student_email: str = Field(min_length=3, max_length=100)
    registration_date: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )
    course_id: int


class StudentRegistrationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_name: str
    student_email: str
    registration_date: datetime
    course_id: int
