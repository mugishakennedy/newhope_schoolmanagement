from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import dos as dos_controller
from newhope_schoolmanagenment.schemas import DOSAccountCreate, DOSRead

router = APIRouter(prefix="/dos/accounts", tags=["dos-accounts"])


@router.post(
    "",
    response_model=DOSRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_dos_account(
    data: DOSAccountCreate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> DOSRead:
    return await dos_controller.create_dos_account(session, data)


@router.get("", response_model=list[DOSRead])
async def list_dos_accounts(
    current_dos: CurrentDOS, session: SessionDep
) -> list[DOSRead]:
    return await dos_controller.list_dos_accounts(session)
