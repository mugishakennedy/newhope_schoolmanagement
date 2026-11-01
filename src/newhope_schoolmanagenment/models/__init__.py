from newhope_schoolmanagenment.models.assignments import Assignment
from newhope_schoolmanagenment.models.base import Base
from newhope_schoolmanagenment.models.classes import Class
from newhope_schoolmanagenment.models.modules import Module
from newhope_schoolmanagenment.models.student_registration import (
    Student,
    StudentRegistration,
)
from newhope_schoolmanagenment.models.studentloginmodel import StudentLogin
from newhope_schoolmanagenment.models.submissions import Submission
from newhope_schoolmanagenment.models.teachers import Teacher

__all__ = [
    "Assignment",
    "Base",
    "Class",
    "Module",
    "Student",
    "StudentLogin",
    "StudentRegistration",
    "Submission",
    "Teacher",
]
