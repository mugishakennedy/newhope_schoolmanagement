from pydantic import BaseModel, ConfigDict


class TeacherSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str


class TeacherRead(TeacherSummary):
    employee_code: str
