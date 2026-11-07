from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
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


async def list_class_stats(session: AsyncSession) -> list[ClassStats]:
    students = (
        select(
            Student.class_id.label("class_id"),
            func.count().label("total"),
        )
        .where(Student.class_id.is_not(None))
        .group_by(Student.class_id)
        .subquery()
    )
    teachers = (
        select(
            TeacherModule.class_id.label("class_id"),
            func.count(func.distinct(TeacherModule.teacher_id)).label("total"),
        )
        .group_by(TeacherModule.class_id)
        .subquery()
    )
    modules = (
        select(
            TeacherModule.class_id.label("class_id"),
            func.count(func.distinct(TeacherModule.module_id)).label("total"),
        )
        .group_by(TeacherModule.class_id)
        .subquery()
    )
    assignments = (
        select(
            Assignment.class_id.label("class_id"),
            func.count().label("total"),
        )
        .group_by(Assignment.class_id)
        .subquery()
    )

    rows = await session.execute(
        select(
            Class,
            func.coalesce(students.c.total, 0),
            func.coalesce(teachers.c.total, 0),
            func.coalesce(modules.c.total, 0),
            func.coalesce(assignments.c.total, 0),
        )
        .outerjoin(students, students.c.class_id == Class.id)
        .outerjoin(teachers, teachers.c.class_id == Class.id)
        .outerjoin(modules, modules.c.class_id == Class.id)
        .outerjoin(assignments, assignments.c.class_id == Class.id)
        .order_by(Class.academic_year.desc(), Class.class_name)
    )

    return [
        ClassStats(
            id=classroom.id,
            class_name=classroom.class_name,
            academic_year=classroom.academic_year,
            students=int(student_total),
            teachers=int(teacher_total),
            modules=int(module_total),
            assignments=int(assignment_total),
        )
        for (
            classroom,
            student_total,
            teacher_total,
            module_total,
            assignment_total,
        ) in rows.all()
    ]


async def get_class_stats(
    session: AsyncSession, class_id: int
) -> ClassStats:
    students = (
        select(func.count())
        .select_from(Student)
        .where(Student.class_id == class_id)
        .scalar_subquery()
    )
    teachers = (
        select(func.count(func.distinct(TeacherModule.teacher_id)))
        .where(TeacherModule.class_id == class_id)
        .scalar_subquery()
    )
    modules = (
        select(func.count(func.distinct(TeacherModule.module_id)))
        .where(TeacherModule.class_id == class_id)
        .scalar_subquery()
    )
    assignments = (
        select(func.count())
        .select_from(Assignment)
        .where(Assignment.class_id == class_id)
        .scalar_subquery()
    )

    row = (
        await session.execute(
            select(
                Class.id,
                Class.class_name,
                Class.academic_year,
                students,
                teachers,
                modules,
                assignments,
            ).where(Class.id == class_id)
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        )

    return ClassStats(
        id=row[0],
        class_name=row[1],
        academic_year=row[2],
        students=int(row[3] or 0),
        teachers=int(row[4] or 0),
        modules=int(row[5] or 0),
        assignments=int(row[6] or 0),
    )
