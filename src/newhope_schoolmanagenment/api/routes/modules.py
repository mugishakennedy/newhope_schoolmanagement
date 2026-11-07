from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import module as module_controller
from newhope_schoolmanagenment.schemas import (
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
)

router = APIRouter(prefix="/dos/modules", tags=["dos-modules"])


@router.post(
    "",
    response_model=ModuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_module(
    data: ModuleCreate, current_dos: CurrentDOS, session: SessionDep
) -> ModuleRead:
    return await module_controller.create_module(session, data)


@router.get("", response_model=list[ModuleRead])
async def list_modules(
    current_dos: CurrentDOS, session: SessionDep
) -> list[ModuleRead]:
    return await module_controller.list_modules(session)


@router.get("/{module_id}", response_model=ModuleRead)
async def get_module(
    module_id: int, current_dos: CurrentDOS, session: SessionDep
) -> ModuleRead:
    return await module_controller.get_module(session, module_id)


@router.patch("/{module_id}", response_model=ModuleRead)
async def update_module(
    module_id: int,
    data: ModuleUpdate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> ModuleRead:
    return await module_controller.update_module(session, module_id, data)


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: int, current_dos: CurrentDOS, session: SessionDep
) -> None:
    await module_controller.delete_module(session, module_id)
