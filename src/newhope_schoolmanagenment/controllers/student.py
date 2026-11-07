from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.security import hash_password, verify_password
from newhope_schoolmanagenment.models import Class, Student
from newhope_schoolmanagenment.schemas import (
    StudentLoginRequest,
    StudentRegistrationCreate,
    StudentUpdate,
)


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
            detail=("A student with this email or registration number already exists"),
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


async def authenticate_student(
    session: AsyncSession, email: str, password: str
) -> Student:
    result = await session.execute(select(Student).where(Student.email == email))
    student = result.scalar_one_or_none()
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    valid, updated_hash = verify_password(password, student.password_hash)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if updated_hash is not None:
        student.password_hash = updated_hash
        await session.commit()
        await session.refresh(student)

    return student


async def login_student(session: AsyncSession, data: StudentLoginRequest) -> Student:
    return await authenticate_student(session, data.email, data.password)


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


async def update_student(
    session: AsyncSession, student_id: int, data: StudentUpdate
) -> Student:
    student = await get_student(session, student_id)
    changes = data.model_dump(exclude_unset=True)
    password = changes.pop("password", None)
    if not changes and password is None:
        return student

    if (
        "class_id" in changes
        and changes["class_id"] is not None
        and await session.get(Class, changes["class_id"]) is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    new_email = changes.get("email", student.email)
    new_registration = changes.get("registration_no", student.registration_no)
    if (
        new_email != student.email
        or new_registration != student.registration_no
    ):
        duplicate = await session.scalar(
            select(Student.id).where(
                (Student.email == new_email)
                | (Student.registration_no == new_registration),
                Student.id != student_id,
            )
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A student with this email or registration number "
                    "already exists"
                ),
            )

    for field, value in changes.items():
        setattr(student, field, value)
    if password:
        student.password_hash = hash_password(password)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not update student. Check that class_id exists "
                "and email/registration_no are unique."
            ),
        ) from exc
    await session.refresh(student)
    return student


async def delete_student(session: AsyncSession, student_id: int) -> None:
    await get_student(session, student_id)
    await session.execute(delete(Student).where(Student.id == student_id))
    await session.commit()
