from fastapi import APIRouter

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import (
    dashboard as dashboard_controller,
)

router = APIRouter(prefix="/dos/dashboard", tags=["dos-dashboard"])


@router.get("")
async def get_dashboard(
    current_dos: CurrentDOS, session: SessionDep
) -> dict[str, int]:
    return await dashboard_controller.get_dashboard(session)
