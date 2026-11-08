from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.controllers.attachment import (
    purge_files_for_assignments,
)
from newhope_schoolmanagenment.models import Assignment, TeacherModule
from newhope_schoolmanagenment.schemas import (
    AssignmentCreate,
    AssignmentUpdate,
    TeacherAssignmentCreate,
    TeacherAssignmentUpdate,
)


async def _ensure_teacher_link(
    session: AsyncSession, teacher_id: int, module_id: int, class_id: int
) -> None:
    allowed = await session.scalar(
        select(TeacherModule.id).where(
            TeacherModule.teacher_id == teacher_id,
            TeacherModule.module_id == module_id,
            TeacherModule.class_id == class_id,
        )
    )
    if allowed is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher is not assigned to this module and class",
        )


async def create_assignment(
    session: AsyncSession, data: AssignmentCreate
) -> Assignment:
    await _ensure_teacher_link(
        session, data.teacher_id, data.module_id, data.class_id
    )

    return await _persist_assignment(
        session,
        teacher_id=data.teacher_id,
        module_id=data.module_id,
        class_id=data.class_id,
        title=data.title,
        description=data.description,
        kind=data.kind,
        deadline=data.deadline,
    )


async def create_teacher_assignment(
    session: AsyncSession, teacher_id: int, data: TeacherAssignmentCreate
) -> Assignment:
    allowed = await session.scalar(
        select(TeacherModule.id).where(
            TeacherModule.teacher_id == teacher_id,
            TeacherModule.module_id == data.module_id,
            TeacherModule.class_id == data.class_id,
        )
    )
    if allowed is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not assigned to this class and module",
        )

    return await _persist_assignment(
        session,
        teacher_id=teacher_id,
        module_id=data.module_id,
        class_id=data.class_id,
        title=data.title,
        description=data.description,
        kind=data.kind,
        deadline=data.deadline,
    )


async def _persist_assignment(
    session: AsyncSession,
    *,
    teacher_id: int,
    module_id: int,
    class_id: int,
    title: str,
    description: str | None,
    deadline: datetime | None,
) -> Assignment:
    assignment = Assignment(
        teacher_id=teacher_id,
        module_id=module_id,
        class_id=class_id,
        title=title,
        description=description,
        deadline=deadline,
    )
    session.add(assignment)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create assignment",
        ) from exc
    await session.refresh(assignment)
    return assignment


async def list_assignments(
    session: AsyncSession,
    class_id: int | None = None,
    teacher_id: int | None = None,
    module_id: int | None = None,
) -> list[Assignment]:
    stmt = select(Assignment).order_by(Assignment.id)
    if class_id is not None:
        stmt = stmt.where(Assignment.class_id == class_id)
    if teacher_id is not None:
        stmt = stmt.where(Assignment.teacher_id == teacher_id)
    if module_id is not None:
        stmt = stmt.where(Assignment.module_id == module_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_assignment(
    session: AsyncSession, assignment_id: int
) -> Assignment:
    assignment = await session.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


async def get_teacher_assignment(
    session: AsyncSession, teacher_id: int, assignment_id: int
) -> Assignment:
    assignment = await session.scalar(
        select(Assignment).where(
            Assignment.id == assignment_id,
            Assignment.teacher_id == teacher_id,
        )
    )
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return assignment


async def update_assignment(
    session: AsyncSession, assignment_id: int, data: AssignmentUpdate
) -> Assignment:
    assignment = await get_assignment(session, assignment_id)
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return assignment

    teacher_id = changes.get("teacher_id", assignment.teacher_id)
    module_id = changes.get("module_id", assignment.module_id)
    class_id = changes.get("class_id", assignment.class_id)
    if (teacher_id, module_id, class_id) != (
        assignment.teacher_id,
        assignment.module_id,
        assignment.class_id,
    ):
        await _ensure_teacher_link(session, teacher_id, module_id, class_id)

    for field, value in changes.items():
        setattr(assignment, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update assignment",
        ) from exc
    await session.refresh(assignment)
    return assignment


async def update_teacher_assignment(
    session: AsyncSession,
    teacher_id: int,
    assignment_id: int,
    data: TeacherAssignmentUpdate,
) -> Assignment:
    assignment = await get_teacher_assignment(
        session, teacher_id, assignment_id
    )
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return assignment

    module_id = changes.get("module_id", assignment.module_id)
    class_id = changes.get("class_id", assignment.class_id)
    if (module_id, class_id) != (assignment.module_id, assignment.class_id):
        await _ensure_teacher_link(session, teacher_id, module_id, class_id)

    for field, value in changes.items():
        setattr(assignment, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update assignment",
        ) from exc
    await session.refresh(assignment)
    return assignment


async def delete_assignment(
    session: AsyncSession, assignment_id: int
) -> None:
    await get_assignment(session, assignment_id)
    await purge_files_for_assignments(session, Assignment.id == assignment_id)
    await session.execute(delete(Assignment).where(Assignment.id == assignment_id))
    await session.commit()


async def delete_teacher_assignment(
    session: AsyncSession, teacher_id: int, assignment_id: int
) -> None:
    await get_teacher_assignment(session, teacher_id, assignment_id)
    await purge_files_for_assignments(session, Assignment.id == assignment_id)
    await session.execute(delete(Assignment).where(Assignment.id == assignment_id))
    await session.commit()
