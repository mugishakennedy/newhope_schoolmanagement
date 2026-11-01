from pydantic import BaseModel, ConfigDict


class TeacherModuleAssign(BaseModel):
    module_id: int
    class_id: int


class TeacherModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    module_id: int
    class_id: int
