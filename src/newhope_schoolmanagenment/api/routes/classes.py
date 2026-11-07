from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import class_ as class_controller
from newhope_schoolmanagenment.schemas import (
    ClassCreate,
    ClassRead,
    ClassUpdate,
)

router = APIRouter(prefix="/dos/classes", tags=["dos-classes"])


@router.post(
    "",
    response_model=ClassRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_class(
    data: ClassCreate, current_dos: CurrentDOS, session: SessionDep
) -> ClassRead:
    return await class_controller.create_class(session, data)


@router.get("", response_model=list[ClassRead])
async def list_classes(
    current_dos: CurrentDOS, session: SessionDep
) -> list[ClassRead]:
    return await class_controller.list_classes(session)


@router.get("/{class_id}", response_model=ClassRead)
async def get_class(
    class_id: int, current_dos: CurrentDOS, session: SessionDep
) -> ClassRead:
    return await class_controller.get_class(session, class_id)


@router.patch("/{class_id}", response_model=ClassRead)
async def update_class(
    class_id: int,
    data: ClassUpdate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> ClassRead:
    return await class_controller.update_class(session, class_id, data)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int, current_dos: CurrentDOS, session: SessionDep
) -> None:
    await class_controller.delete_class(session, class_id)
