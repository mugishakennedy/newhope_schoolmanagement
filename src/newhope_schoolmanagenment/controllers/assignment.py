from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import Assignment, TeacherModule
from newhope_schoolmanagenment.schemas import AssignmentCreate


async def create_assignment(
    session: AsyncSession, data: AssignmentCreate
) -> Assignment:
    allowed = await session.scalar(
        select(TeacherModule.id).where(
            TeacherModule.teacher_id == data.teacher_id,
            TeacherModule.module_id == data.module_id,
            TeacherModule.class_id == data.class_id,
        )
    )
    if allowed is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teacher is not assigned to this module and class",
        )

    assignment = Assignment(
        teacher_id=data.teacher_id,
        module_id=data.module_id,
        class_id=data.class_id,
        title=data.title,
        description=data.description,
        deadline=data.deadline,
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
