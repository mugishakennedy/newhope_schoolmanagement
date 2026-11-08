from datetime import datetime

from pydantic import BaseModel, ConfigDict

from newhope_schoolmanagenment.schemas.classes import ClassRead
from newhope_schoolmanagenment.schemas.modules import ModuleSummary
from newhope_schoolmanagenment.schemas.teachers import TeacherSummary


class AssignmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    kind: str
    deadline: datetime | None
    module: ModuleSummary


class AssignmentRead(AssignmentSummary):
    description: str | None
    created_at: datetime
    teacher: TeacherSummary
    school_class: ClassRead
