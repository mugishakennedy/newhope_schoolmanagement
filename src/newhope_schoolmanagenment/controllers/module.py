from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import Module
from newhope_schoolmanagenment.schemas import ModuleCreate


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
