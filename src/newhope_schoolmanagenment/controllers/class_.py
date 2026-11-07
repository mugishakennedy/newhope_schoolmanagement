from fastapi import HTTPException, status
<<<<<<< HEAD
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import Class
from newhope_schoolmanagenment.schemas import ClassCreate, ClassUpdate
=======
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Student,
    TeacherModule,
)
from newhope_schoolmanagenment.schemas import ClassCreate, ClassUpdate
from newhope_schoolmanagenment.schemas.class_ import ClassStats
>>>>>>> bcefb46 (new_upd)


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
    result = await session.execute(
        select(Class).order_by(Class.academic_year.desc(), Class.class_name)
    )
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
<<<<<<< HEAD
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

=======

    class_name = (
        data.class_name if data.class_name is not None else classroom.class_name
    )
    academic_year = (
        data.academic_year
        if data.academic_year is not None
        else classroom.academic_year
    )

    duplicate = await session.execute(
        select(Class).where(
            Class.class_name == class_name,
            Class.academic_year == academic_year,
            Class.id != class_id,
        )
    )
    if duplicate.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This class already exists for the academic year",
        )

    classroom.class_name = class_name
    classroom.academic_year = academic_year
>>>>>>> bcefb46 (new_upd)
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
<<<<<<< HEAD
    await get_class(session, class_id)
    await session.execute(delete(Class).where(Class.id == class_id))
    await session.commit()
=======
    classroom = await get_class(session, class_id)
    await session.delete(classroom)
    await session.commit()


async def _grouped_counts(session: AsyncSession, column, distinct=None):
    count = (
        func.count(func.distinct(distinct))
        if distinct is not None
        else func.count()
    )
    rows = await session.execute(
        select(column, count).where(column.is_not(None)).group_by(column)
    )
    return {key: int(value) for key, value in rows.all()}


async def list_class_stats(session: AsyncSession) -> list[ClassStats]:
    classes = await list_classes(session)
    students = await _grouped_counts(session, Student.class_id)
    teachers = await _grouped_counts(
        session, TeacherModule.class_id, TeacherModule.teacher_id
    )
    modules = await _grouped_counts(
        session, TeacherModule.class_id, TeacherModule.module_id
    )
    assignments = await _grouped_counts(session, Assignment.class_id)

    return [
        ClassStats(
            id=item.id,
            class_name=item.class_name,
            academic_year=item.academic_year,
            students=students.get(item.id, 0),
            teachers=teachers.get(item.id, 0),
            modules=modules.get(item.id, 0),
            assignments=assignments.get(item.id, 0),
        )
        for item in classes
    ]


async def get_class_stats(
    session: AsyncSession, class_id: int
) -> ClassStats:
    classroom = await get_class(session, class_id)

    students = await session.scalar(
        select(func.count())
        .select_from(Student)
        .where(Student.class_id == class_id)
    )
    teachers = await session.scalar(
        select(func.count(func.distinct(TeacherModule.teacher_id))).where(
            TeacherModule.class_id == class_id
        )
    )
    modules = await session.scalar(
        select(func.count(func.distinct(TeacherModule.module_id))).where(
            TeacherModule.class_id == class_id
        )
    )
    assignments = await session.scalar(
        select(func.count())
        .select_from(Assignment)
        .where(Assignment.class_id == class_id)
    )

    return ClassStats(
        id=classroom.id,
        class_name=classroom.class_name,
        academic_year=classroom.academic_year,
        students=int(students or 0),
        teachers=int(teachers or 0),
        modules=int(modules or 0),
        assignments=int(assignments or 0),
    )
>>>>>>> bcefb46 (new_upd)
