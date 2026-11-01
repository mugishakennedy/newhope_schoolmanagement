from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.core.security import (
    hash_password,
    verify_password,
)
from newhope_schoolmanagenment.models import DOS
from newhope_schoolmanagenment.schemas import DOSAccountCreate, DOSCreate


async def authenticate_dos(
    session: AsyncSession, email: str, password: str
) -> DOS:
    result = await session.execute(select(DOS).where(DOS.email == email))
    dos = result.scalar_one_or_none()
    if dos is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    valid, updated_hash = verify_password(password, dos.password_hash)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if updated_hash is not None:
        dos.password_hash = updated_hash
        await session.commit()
        await session.refresh(dos)

    return dos


async def bootstrap_dos(session: AsyncSession, data: DOSCreate) -> DOS:
    count = await session.scalar(select(func.count()).select_from(DOS))
    if count:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A DOS account already exists",
        )

    dos = DOS(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    session.add(dos)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use",
        ) from exc
    await session.refresh(dos)
    return dos


async def get_dos(session: AsyncSession, dos_id: int) -> DOS:
    dos = await session.get(DOS, dos_id)
    if dos is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="DOS account not found",
        )
    return dos


async def list_dos_accounts(session: AsyncSession) -> list[DOS]:
    result = await session.execute(select(DOS).order_by(DOS.id))
    return list(result.scalars().all())


async def create_dos_account(
    session: AsyncSession, data: DOSAccountCreate
) -> DOS:
    existing = await session.scalar(
        select(DOS.id).where(DOS.email == data.email)
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    dos = DOS(
        full_name=data.full_name or data.email.split("@", 1)[0],
        email=data.email,
        password_hash=hash_password(data.password),
    )
    session.add(dos)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc
    await session.refresh(dos)
    return dos


async def ensure_default_dos(session: AsyncSession) -> None:
    settings = get_settings()
    if not settings.seed_default_dos:
        return
    if not settings.default_dos_email or not settings.default_dos_password:
        return

    count = await session.scalar(select(func.count()).select_from(DOS))
    if count:
        return

    dos = DOS(
        full_name=settings.default_dos_name,
        email=settings.default_dos_email,
        password_hash=hash_password(settings.default_dos_password),
    )
    session.add(dos)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        return
    print(f"Default DOS account created: {settings.default_dos_email}")
