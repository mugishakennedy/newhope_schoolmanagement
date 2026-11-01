from collections.abc import AsyncIterator

import asyncpg
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from newhope_schoolmanagenment.core.config import get_settings
from newhope_schoolmanagenment.models import Base

_pool: asyncpg.Pool | None = None
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


async def connect() -> None:
    global _pool, _engine, _session_factory
    settings = get_settings()
    _pool = await asyncpg.create_pool(
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        host=settings.db_host,
        port=settings.db_port,
        min_size=1,
        max_size=10,
    )
    _engine = create_async_engine(settings.database_async_url, pool_pre_ping=True)
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("successfully connected to database")


async def disconnect() -> None:
    global _pool, _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
    if _pool is not None:
        await _pool.close()
        _pool = None
    print("database connection closed")


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool is not initialized")
    return _pool


async def get_session() -> AsyncIterator[AsyncSession]:
    if _session_factory is None:
        raise RuntimeError("Database session factory is not initialized")
    async with _session_factory() as session:
        yield session
