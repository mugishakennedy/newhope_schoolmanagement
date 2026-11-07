from pydantic import BaseModel, ConfigDict

from newhope_schoolmanagenment.schemas.classes import ClassRead
from newhope_schoolmanagenment.schemas.module import ModuleRead


class TeacherModuleAssign(BaseModel):
    module_id: int
    class_id: int


class TeacherModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    module_id: int
    class_id: int


class TeacherModuleDetail(BaseModel):
    """A teacher's assigned module together with the course/class it applies to."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    module: ModuleRead
    school_class: ClassRead
