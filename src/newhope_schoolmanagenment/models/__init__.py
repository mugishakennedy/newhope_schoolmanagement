from newhope_schoolmanagenment.models.base import Base
from newhope_schoolmanagenment.models.classes import Class
from newhope_schoolmanagenment.models.student_registration import (
    Student,
    StudentRegistration,
)
from newhope_schoolmanagenment.models.studentloginmodel import StudentLogin

__all__ = [
    "Base",
    "Class",
    "Student",
    "StudentLogin",
    "StudentRegistration",
]
