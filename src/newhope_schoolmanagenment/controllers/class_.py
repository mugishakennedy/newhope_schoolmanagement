from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import Class
from newhope_schoolmanagenment.schemas import ClassCreate, ClassUpdate


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


async def update_class(
    session: AsyncSession, class_id: int, data: ClassUpdate
) -> Class:
    classroom = await get_class(session, class_id)
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return classroom

    new_name = changes.get("class_name", classroom.class_name)
    new_year = changes.get("academic_year", classroom.academic_year)
    if new_name != classroom.class_name or new_year != classroom.academic_year:
        duplicate = await session.scalar(
            select(Class.id).where(
                Class.class_name == new_name,
                Class.academic_year == new_year,
                Class.id != class_id,
            )
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This class already exists for the academic year",
            )

    for field, value in changes.items():
        setattr(classroom, field, value)

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


async def delete_class(session: AsyncSession, class_id: int) -> None:
    await get_class(session, class_id)
    await session.execute(delete(Class).where(Class.id == class_id))
    await session.commit()
