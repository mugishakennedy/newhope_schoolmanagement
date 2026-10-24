from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import StudentRegistration
from newhope_schoolmanagenment.schemas import StudentRegistrationCreate


async def create_student(
    session: AsyncSession, data: StudentRegistrationCreate
) -> StudentRegistration:
    student = StudentRegistration(**data.model_dump())
    session.add(student)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A student with this email already exists",
        ) from exc
    await session.refresh(student)
    return student
