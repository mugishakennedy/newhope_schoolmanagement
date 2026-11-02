from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.security import verify_password
from newhope_schoolmanagenment.models import DOS, Student, Teacher
from newhope_schoolmanagenment.schemas.auth import Role, SessionUser


async def _verify_account_password(
    session: AsyncSession, account: DOS | Student | Teacher, password: str
) -> None:
    valid, updated_hash = verify_password(password, account.password_hash)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if updated_hash is not None:
        account.password_hash = updated_hash
        await session.commit()


async def authenticate(
    session: AsyncSession, identifier: str, password: str
) -> tuple[Role, DOS | Student | Teacher]:
    identifier = identifier.strip()

    dos = await session.scalar(select(DOS).where(DOS.email == identifier))
    if dos is not None:
        await _verify_account_password(session, dos, password)
        return "dos", dos

    teacher = await session.scalar(
        select(Teacher).where(
            or_(
                Teacher.email == identifier,
                Teacher.employee_code == identifier,
            )
        )
    )
    if teacher is not None:
        await _verify_account_password(session, teacher, password)
        return "teacher", teacher

    student = await session.scalar(
        select(Student).where(
            or_(
                Student.email == identifier,
                Student.registration_no == identifier,
            )
        )
    )
    if student is not None:
        await _verify_account_password(session, student, password)
        return "student", student

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )


async def get_account(
    session: AsyncSession, role: str, user_id: int
) -> DOS | Student | Teacher | None:
    if role == "dos":
        return await session.get(DOS, user_id)
    if role == "teacher":
        return await session.get(Teacher, user_id)
    if role == "student":
        return await session.get(Student, user_id)
    return None


def build_session_user(
    role: Role, account: DOS | Student | Teacher
) -> SessionUser:
    if role == "student" and isinstance(account, Student):
        return SessionUser(
            id=account.id,
            full_name=account.full_name,
            email=account.email,
            role=role,
            registration_no=account.registration_no,
            class_id=account.class_id,
        )
    if role == "teacher" and isinstance(account, Teacher):
        return SessionUser(
            id=account.id,
            full_name=account.full_name,
            email=account.email,
            role=role,
            employee_code=account.employee_code,
        )
    if role == "dos" and isinstance(account, DOS):
        return SessionUser(
            id=account.id,
            full_name=account.full_name,
            email=account.email,
            role=role,
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
