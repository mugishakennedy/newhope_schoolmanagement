from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import Class
from newhope_schoolmanagenment.schemas import ClassCreate


async def create_class(session: AsyncSession, data: ClassCreate) -> Class:
    result = await session.execute(
        select(Class).where(
            Class.class_name == data.class_name,
            Class.academic_year == data.academic_year,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This class already exists for the academic year",
        )

    classroom = Class(
        class_name=data.class_name,
        academic_year=data.academic_year,
    )
    session.add(classroom)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This class already exists for the academic year",
        ) from exc
    await session.refresh(classroom)
    return classroom


async def list_classes(session: AsyncSession) -> list[Class]:
    result = await session.execute(select(Class).order_by(Class.id))
    return list(result.scalars().all())


async def get_class(session: AsyncSession, class_id: int) -> Class:
    classroom = await session.get(Class, class_id)
    if classroom is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )
    return classroom
