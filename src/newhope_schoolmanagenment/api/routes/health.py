from fastapi import APIRouter

from newhope_schoolmanagenment.core.database import get_pool

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    pool = get_pool()
    value = await pool.fetchval("SELECT 1")
    return {"status": "ok", "database": value == 1}
