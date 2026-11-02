from pydantic import BaseModel, ConfigDict


class ClassRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_name: str
    academic_year: str
