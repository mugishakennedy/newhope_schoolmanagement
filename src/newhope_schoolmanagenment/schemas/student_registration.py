from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StudentRegistrationCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=72)
    registration_no: str = Field(min_length=1, max_length=50)
    class_id: int | None = None


class StudentUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    email: str | None = Field(default=None, min_length=3, max_length=150)
    registration_no: str | None = Field(default=None, min_length=1, max_length=50)
    class_id: int | None = None
    password: str | None = Field(default=None, min_length=8, max_length=72)


class StudentLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=1, max_length=72)


class StudentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    registration_no: str


class StudentRegistrationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    registration_no: str
    class_id: int | None
    created_at: datetime


class StudentLoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int
    student: StudentRegistrationRead
