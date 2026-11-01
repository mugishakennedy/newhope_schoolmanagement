from newhope_schoolmanagenment.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
)
from newhope_schoolmanagenment.schemas.auth import (
    MessageResponse,
    TokenResponse,
)
from newhope_schoolmanagenment.schemas.class_ import ClassCreate, ClassRead
from newhope_schoolmanagenment.schemas.dos import (
    DOSAccountCreate,
    DOSCreate,
    DOSRead,
)
from newhope_schoolmanagenment.schemas.module import ModuleCreate, ModuleRead
from newhope_schoolmanagenment.schemas.student_registration import (
    StudentLoginRequest,
    StudentLoginResponse,
    StudentRegistrationCreate,
    StudentRegistrationRead,
)
from newhope_schoolmanagenment.schemas.submission import (
    SubmissionCreate,
    SubmissionGradeUpdate,
    SubmissionRead,
)
from newhope_schoolmanagenment.schemas.teacher import (
    TeacherCreate,
    TeacherRead,
)
from newhope_schoolmanagenment.schemas.teacher_module import (
    TeacherModuleAssign,
    TeacherModuleRead,
)

__all__ = [
    "AssignmentCreate",
    "AssignmentRead",
    "ClassCreate",
    "ClassRead",
    "DOSAccountCreate",
    "DOSCreate",
    "DOSRead",
    "MessageResponse",
    "ModuleCreate",
    "ModuleRead",
    "StudentLoginRequest",
    "StudentLoginResponse",
    "StudentRegistrationCreate",
    "StudentRegistrationRead",
    "SubmissionCreate",
    "SubmissionGradeUpdate",
    "SubmissionRead",
    "TeacherCreate",
    "TeacherModuleAssign",
    "TeacherModuleRead",
    "TeacherRead",
    "TokenResponse",
]
