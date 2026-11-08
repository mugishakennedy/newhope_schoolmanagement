from newhope_schoolmanagenment.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    TeacherAssignmentCreate,
    TeacherAssignmentUpdate,
)
from newhope_schoolmanagenment.schemas.attachment import AttachmentRead
from newhope_schoolmanagenment.schemas.auth import (
    MessageResponse,
    TokenResponse,
)
from newhope_schoolmanagenment.schemas.class_ import (
    ClassCreate,
    ClassRead,
    ClassStats,
    ClassUpdate,
)
from newhope_schoolmanagenment.schemas.dos import (
    DOSAccountCreate,
    DOSCreate,
    DOSRead,
)
from newhope_schoolmanagenment.schemas.module import (
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
)
from newhope_schoolmanagenment.schemas.quiz import (
    QuizAnswerInput,
    QuizAnswerRead,
    QuizAttemptInput,
    QuizAttemptRead,
    QuizOptionInput,
    QuizOptionRead,
    QuizOptionTeacherRead,
    QuizPayload,
    QuizQuestionInput,
    QuizQuestionRead,
    QuizQuestionTeacherRead,
    QuizRead,
    QuizTeacherRead,
)
from newhope_schoolmanagenment.schemas.student_registration import (
    StudentLoginRequest,
    StudentLoginResponse,
    StudentRegistrationCreate,
    StudentRegistrationRead,
    StudentUpdate,
)
from newhope_schoolmanagenment.schemas.submission import (
    SubmissionCreate,
    SubmissionGradeUpdate,
    SubmissionRead,
)
from newhope_schoolmanagenment.schemas.teacher import (
    TeacherCreate,
    TeacherRead,
    TeacherUpdate,
)
from newhope_schoolmanagenment.schemas.teacher_module import (
    TeacherModuleAssign,
    TeacherModuleDetail,
    TeacherModuleRead,
)

__all__ = [
    "AssignmentCreate",
    "AssignmentRead",
    "AssignmentUpdate",
    "AttachmentRead",
    "ClassCreate",
    "ClassRead",
    "ClassStats",
    "ClassUpdate",
    "DOSAccountCreate",
    "DOSCreate",
    "DOSRead",
    "MessageResponse",
    "ModuleCreate",
    "ModuleRead",
    "ModuleUpdate",
    "QuizAnswerInput",
    "QuizAnswerRead",
    "QuizAttemptInput",
    "QuizAttemptRead",
    "QuizOptionInput",
    "QuizOptionRead",
    "QuizOptionTeacherRead",
    "QuizPayload",
    "QuizQuestionInput",
    "QuizQuestionRead",
    "QuizQuestionTeacherRead",
    "QuizRead",
    "QuizTeacherRead",
    "StudentLoginRequest",
    "StudentLoginResponse",
    "StudentRegistrationCreate",
    "StudentRegistrationRead",
    "StudentUpdate",
    "SubmissionCreate",
    "SubmissionGradeUpdate",
    "SubmissionRead",
    "TeacherAssignmentCreate",
    "TeacherAssignmentUpdate",
    "TeacherCreate",
    "TeacherModuleAssign",
    "TeacherModuleDetail",
    "TeacherModuleRead",
    "TeacherRead",
    "TeacherUpdate",
    "TokenResponse",
]
