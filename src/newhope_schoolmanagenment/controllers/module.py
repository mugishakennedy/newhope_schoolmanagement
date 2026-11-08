from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.controllers.attachment import (
    purge_files_for_assignments,
)
from newhope_schoolmanagenment.models import Assignment, Module
from newhope_schoolmanagenment.schemas import ModuleCreate, ModuleUpdate


async def create_module(session: AsyncSession, data: ModuleCreate) -> Module:
    result = await session.execute(
        select(Module).where(Module.module_code == data.module_code)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A module with this code already exists",
        )

    module = Module(
        module_code=data.module_code,
        module_name=data.module_name,
        description=data.description,
    )
    session.add(module)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A module with this code already exists",
        ) from exc
    await session.refresh(module)
    return module


async def list_modules(session: AsyncSession) -> list[Module]:
    result = await session.execute(select(Module).order_by(Module.id))
    return list(result.scalars().all())


async def get_module(session: AsyncSession, module_id: int) -> Module:
    module = await session.get(Module, module_id)
    if module is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return module


async def update_module(
    session: AsyncSession, module_id: int, data: ModuleUpdate
) -> Module:
    module = await get_module(session, module_id)
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        return module

    new_code = changes.get("module_code", module.module_code)
    if new_code != module.module_code:
        duplicate = await session.scalar(
            select(Module.id).where(
                Module.module_code == new_code,
                Module.id != module_id,
            )
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A module with this code already exists",
            )

    for field, value in changes.items():
        setattr(module, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A module with this code already exists",
        ) from exc
    await session.refresh(module)
    return module


async def delete_module(session: AsyncSession, module_id: int) -> None:
    await get_module(session, module_id)
    await purge_files_for_assignments(session, Assignment.module_id == module_id)
    await session.execute(delete(Module).where(Module.id == module_id))
    await session.commit()
