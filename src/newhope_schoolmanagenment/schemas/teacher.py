from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TeacherCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=8, max_length=72)
    employee_code: str = Field(min_length=1, max_length=50)


class TeacherRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    employee_code: str
    created_at: datetime
