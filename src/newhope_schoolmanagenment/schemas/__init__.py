from newhope_schoolmanagenment.schemas.assignments import (
    AssignmentRead,
    AssignmentSummary,
)
from newhope_schoolmanagenment.schemas.auth import (
    MessageResponse,
    TokenResponse,
)
from newhope_schoolmanagenment.schemas.classes import ClassRead
from newhope_schoolmanagenment.schemas.modules import ModuleRead, ModuleSummary
from newhope_schoolmanagenment.schemas.student_registration import (
    StudentLoginRequest,
    StudentLoginResponse,
    StudentRegistrationCreate,
    StudentRegistrationRead,
)
from newhope_schoolmanagenment.schemas.submissions import (
    SubmissionCreate,
    SubmissionRead,
    SubmissionUpdate,
    SubmissionWithAssignment,
)
from newhope_schoolmanagenment.schemas.teachers import (
    TeacherRead,
    TeacherSummary,
)

__all__ = [
    "AssignmentRead",
    "AssignmentSummary",
    "ClassRead",
    "MessageResponse",
    "ModuleRead",
    "ModuleSummary",
    "StudentLoginRequest",
    "StudentLoginResponse",
    "StudentRegistrationCreate",
    "StudentRegistrationRead",
    "SubmissionCreate",
    "SubmissionRead",
    "SubmissionUpdate",
    "SubmissionWithAssignment",
    "TeacherRead",
    "TeacherSummary",
    "TokenResponse",
]
