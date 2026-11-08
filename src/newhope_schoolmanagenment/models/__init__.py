from newhope_schoolmanagenment.models.assignment import Assignment
from newhope_schoolmanagenment.models.assignment_attachment import (
    AssignmentAttachment,
)
from newhope_schoolmanagenment.models.base import Base
from newhope_schoolmanagenment.models.classes import Class
from newhope_schoolmanagenment.models.dos import DOS
from newhope_schoolmanagenment.models.module import Module
from newhope_schoolmanagenment.models.quiz import (
    QuizAnswer,
    QuizAttempt,
    QuizOption,
    QuizQuestion,
)
from newhope_schoolmanagenment.models.student_registration import (
    Student,
    StudentRegistration,
)
from newhope_schoolmanagenment.models.studentloginmodel import StudentLogin
from newhope_schoolmanagenment.models.submission import Submission
from newhope_schoolmanagenment.models.teacher import Teacher
from newhope_schoolmanagenment.models.teacher_module import TeacherModule

__all__ = [
    "DOS",
    "Assignment",
    "AssignmentAttachment",
    "Base",
    "Class",
    "Module",
    "QuizAnswer",
    "QuizAttempt",
    "QuizOption",
    "QuizQuestion",
    "Student",
    "StudentLogin",
    "StudentRegistration",
    "Submission",
    "Teacher",
    "TeacherModule",
]
