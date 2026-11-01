import bcrypt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import Student
from newhope_schoolmanagenment.schemas import (
    StudentLoginRequest,
    StudentRegistrationCreate,
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )
    except ValueError:
        return False


async def create_student(
    session: AsyncSession, data: StudentRegistrationCreate
) -> Student:
    result = await session.execute(
        select(Student).where(
            (Student.email == data.email)
            | (Student.registration_no == data.registration_no)
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A student with this email or registration number "
                "already exists"
            ),
        )

    student = Student(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        registration_no=data.registration_no,
        class_id=data.class_id,
    )
    session.add(student)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not register student. Check that class_id exists "
                "and email/registration_no are unique."
            ),
        ) from exc
    await session.refresh(student)
    return student


async def login_student(
    session: AsyncSession, data: StudentLoginRequest
) -> Student:
    result = await session.execute(
        select(Student).where(Student.email == data.email)
    )
    student = result.scalar_one_or_none()
    if student is None or not verify_password(
        data.password, student.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return student


async def list_students(session: AsyncSession) -> list[Student]:
    result = await session.execute(select(Student).order_by(Student.id))
    return list(result.scalars().all())


async def get_student(session: AsyncSession, student_id: int) -> Student:
    student = await session.get(Student, student_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student
