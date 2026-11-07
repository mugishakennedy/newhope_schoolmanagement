from pydantic import BaseModel, ConfigDict, Field


class ClassCreate(BaseModel):
    class_name: str = Field(min_length=1, max_length=100)
    academic_year: str = Field(min_length=1, max_length=20)


class ClassUpdate(BaseModel):
    class_name: str | None = Field(default=None, min_length=1, max_length=100)
    academic_year: str | None = Field(default=None, min_length=1, max_length=20)


class ClassRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_name: str
    academic_year: str


class ClassStats(ClassRead):
    students: int = 0
    teachers: int = 0
    modules: int = 0
    assignments: int = 0
