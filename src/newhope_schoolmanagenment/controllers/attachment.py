from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.storage import (
    delete_uploaded_file,
    save_assignment_file,
)
from newhope_schoolmanagenment.models import Assignment, AssignmentAttachment


async def list_assignment_attachments(
    session: AsyncSession, assignment_id: int
) -> list[AssignmentAttachment]:
    result = await session.execute(
        select(AssignmentAttachment)
        .where(AssignmentAttachment.assignment_id == assignment_id)
        .order_by(AssignmentAttachment.id)
    )
    return list(result.scalars().all())


async def create_assignment_attachment(
    session: AsyncSession,
    assignment_id: int,
    uploaded_by_teacher_id: int | None,
    upload: UploadFile,
) -> AssignmentAttachment:
    saved = await save_assignment_file(upload)
    attachment = AssignmentAttachment(
        assignment_id=assignment_id,
        uploaded_by_teacher_id=uploaded_by_teacher_id,
        original_name=saved.original_name,
        content_url=saved.url,
        content_type=saved.content_type,
        size_bytes=saved.size_bytes,
    )
    session.add(attachment)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        delete_uploaded_file(saved.url)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not save the attachment",
        ) from exc
    await session.refresh(attachment)
    return attachment


async def delete_assignment_attachment(
    session: AsyncSession, assignment_id: int, attachment_id: int
) -> None:
    attachment = await session.scalar(
        select(AssignmentAttachment).where(
            AssignmentAttachment.id == attachment_id,
            AssignmentAttachment.assignment_id == assignment_id,
        )
    )
    if attachment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )

    content_url = attachment.content_url
    await session.execute(
        delete(AssignmentAttachment).where(
            AssignmentAttachment.id == attachment_id
        )
    )
    await session.commit()
    delete_uploaded_file(content_url)


async def purge_files_for_assignments(
    session: AsyncSession, *criteria: object
) -> None:
    stmt = select(AssignmentAttachment.content_url).join(
        Assignment, Assignment.id == AssignmentAttachment.assignment_id
    )
    for criterion in criteria:
        stmt = stmt.where(criterion)

    result = await session.execute(stmt)
    for content_url in result.scalars().all():
        delete_uploaded_file(content_url)
