from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.security import hash_password
from newhope_schoolmanagenment.models import (
    Class,
    Module,
    Teacher,
    TeacherModule,
)
from newhope_schoolmanagenment.schemas import (
    TeacherCreate,
    TeacherModuleAssign,
)


async def create_teacher(
    session: AsyncSession, data: TeacherCreate
) -> Teacher:
    result = await session.execute(
        select(Teacher).where(
            (Teacher.email == data.email)
            | (Teacher.employee_code == data.employee_code)
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A teacher with this email or employee code already exists"
            ),
        )

    teacher = Teacher(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        employee_code=data.employee_code,
    )
    session.add(teacher)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create teacher",
        ) from exc
    await session.refresh(teacher)
    return teacher


async def list_teachers(session: AsyncSession) -> list[Teacher]:
    result = await session.execute(select(Teacher).order_by(Teacher.id))
    return list(result.scalars().all())


async def get_teacher(session: AsyncSession, teacher_id: int) -> Teacher:
    teacher = await session.get(Teacher, teacher_id)
    if teacher is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )
    return teacher


async def assign_module(
    session: AsyncSession,
    teacher_id: int,
    data: TeacherModuleAssign,
) -> TeacherModule:
    await get_teacher(session, teacher_id)

    if await session.get(Module, data.module_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    if await session.get(Class, data.class_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    existing = await session.scalar(
        select(TeacherModule.id).where(
            TeacherModule.teacher_id == teacher_id,
            TeacherModule.module_id == data.module_id,
            TeacherModule.class_id == data.class_id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher is already assigned to this module and class",
        )

    link = TeacherModule(
        teacher_id=teacher_id,
        module_id=data.module_id,
        class_id=data.class_id,
    )
    session.add(link)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Teacher is already assigned to this module and class",
        ) from exc
    await session.refresh(link)
    return link
