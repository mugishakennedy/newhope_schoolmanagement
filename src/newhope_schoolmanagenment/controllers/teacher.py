from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from newhope_schoolmanagenment.core.security import hash_password
from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Module,
    Submission,
    Teacher,
    TeacherModule,
)
from newhope_schoolmanagenment.schemas import (
    SubmissionGradeUpdate,
    TeacherCreate,
    TeacherModuleAssign,
    TeacherUpdate,
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


async def update_teacher(
    session: AsyncSession, teacher_id: int, data: TeacherUpdate
) -> Teacher:
    teacher = await get_teacher(session, teacher_id)
    changes = data.model_dump(exclude_unset=True)
    password = changes.pop("password", None)
    if not changes and password is None:
        return teacher

    new_email = changes.get("email", teacher.email)
    new_code = changes.get("employee_code", teacher.employee_code)
    if new_email != teacher.email or new_code != teacher.employee_code:
        duplicate = await session.scalar(
            select(Teacher.id).where(
                (Teacher.email == new_email)
                | (Teacher.employee_code == new_code),
                Teacher.id != teacher_id,
            )
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A teacher with this email or employee code already exists"
                ),
            )

    for field, value in changes.items():
        setattr(teacher, field, value)
    if password:
        teacher.password_hash = hash_password(password)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A teacher with this email or employee code already exists",
        ) from exc
    await session.refresh(teacher)
    return teacher


async def delete_teacher(session: AsyncSession, teacher_id: int) -> None:
    await get_teacher(session, teacher_id)
    await session.execute(delete(Teacher).where(Teacher.id == teacher_id))
    await session.commit()


async def unassign_module(
    session: AsyncSession, teacher_id: int, link_id: int
) -> None:
    await get_teacher(session, teacher_id)
    link = await session.scalar(
        select(TeacherModule).where(
            TeacherModule.id == link_id,
            TeacherModule.teacher_id == teacher_id,
        )
    )
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher module assignment not found",
        )
    await session.execute(
        delete(TeacherModule).where(TeacherModule.id == link_id)
    )
    await session.commit()


async def list_teacher_teaching_links(
    session: AsyncSession, teacher_id: int
) -> list[TeacherModule]:
    result = await session.execute(
        select(TeacherModule)
        .where(TeacherModule.teacher_id == teacher_id)
        .order_by(TeacherModule.id)
    )
    return list(result.scalars().all())


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


async def list_teacher_assignments(
    session: AsyncSession, teacher_id: int
) -> list[Assignment]:
    result = await session.execute(
        select(Assignment)
        .where(Assignment.teacher_id == teacher_id)
        .options(
            selectinload(Assignment.teacher),
            selectinload(Assignment.module),
            selectinload(Assignment.school_class),
        )
        .order_by(Assignment.deadline.asc().nulls_last(), Assignment.id)
    )
    return list(result.scalars().all())


async def list_teacher_classes(
    session: AsyncSession, teacher_id: int
) -> list[Class]:
    result = await session.execute(
        select(Class)
        .join(TeacherModule, TeacherModule.class_id == Class.id)
        .where(TeacherModule.teacher_id == teacher_id)
        .distinct()
        .order_by(Class.class_name, Class.id)
    )
    return list(result.scalars().all())


async def list_teacher_modules(
    session: AsyncSession, teacher_id: int
) -> list[Module]:
    result = await session.execute(
        select(Module)
        .join(TeacherModule, TeacherModule.module_id == Module.id)
        .where(TeacherModule.teacher_id == teacher_id)
        .distinct()
        .order_by(Module.module_name, Module.id)
    )
    return list(result.scalars().all())


async def list_teacher_module_links(
    session: AsyncSession, teacher_id: int
) -> list[TeacherModule]:
    result = await session.execute(
        select(TeacherModule)
        .where(TeacherModule.teacher_id == teacher_id)
        .options(
            selectinload(TeacherModule.module),
            selectinload(TeacherModule.school_class),
        )
        .order_by(TeacherModule.class_id, TeacherModule.module_id)
    )
    return list(result.scalars().all())


def _teacher_submission_query(teacher_id: int):
    return (
        select(Submission)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .where(Assignment.teacher_id == teacher_id)
        .options(
            selectinload(Submission.student),
            selectinload(Submission.assignment).selectinload(Assignment.module),
        )
    )


async def list_teacher_submissions(
    session: AsyncSession,
    teacher_id: int,
    assignment_id: int | None = None,
) -> list[Submission]:
    query = _teacher_submission_query(teacher_id)
    if assignment_id is not None:
        query = query.where(Submission.assignment_id == assignment_id)
    result = await session.execute(
        query.order_by(Submission.submitted_at.desc(), Submission.id)
    )
    return list(result.scalars().all())


async def get_teacher_submission(
    session: AsyncSession, teacher_id: int, submission_id: int
) -> Submission:
    result = await session.execute(
        _teacher_submission_query(teacher_id).where(
            Submission.id == submission_id
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    return submission


async def grade_teacher_submission(
    session: AsyncSession,
    teacher_id: int,
    submission_id: int,
    data: SubmissionGradeUpdate,
) -> Submission:
    submission = await get_teacher_submission(
        session, teacher_id, submission_id
    )
    submission.grade = data.grade
    submission.feedback = data.feedback
    await session.commit()
    return await get_teacher_submission(session, teacher_id, submission_id)


async def get_teacher_dashboard(
    session: AsyncSession, teacher_id: int
) -> dict[str, int]:
    async def count(model, *criteria) -> int:
        value = await session.scalar(
            select(func.count()).select_from(model).where(*criteria)
        )
        return int(value or 0)

    ungraded = await session.scalar(
        select(func.count())
        .select_from(Submission)
        .join(Assignment, Submission.assignment_id == Assignment.id)
        .where(
            Assignment.teacher_id == teacher_id,
            Submission.grade.is_(None),
        )
    )

    return {
        "assignments": await count(
            Assignment, Assignment.teacher_id == teacher_id
        ),
        "submissions": await session.scalar(
            select(func.count())
            .select_from(Submission)
            .join(Assignment, Submission.assignment_id == Assignment.id)
            .where(Assignment.teacher_id == teacher_id)
        )
        or 0,
        "ungraded_submissions": int(ungraded or 0),
        "classes": await session.scalar(
            select(func.count(func.distinct(TeacherModule.class_id))).where(
                TeacherModule.teacher_id == teacher_id
            )
        )
        or 0,
        "modules": await session.scalar(
            select(func.count(func.distinct(TeacherModule.module_id))).where(
                TeacherModule.teacher_id == teacher_id
            )
        )
        or 0,
    }

