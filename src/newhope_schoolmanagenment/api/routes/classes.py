from fastapi import APIRouter, status

from newhope_schoolmanagenment.api.deps import CurrentDOS, SessionDep
from newhope_schoolmanagenment.controllers import class_ as class_controller
from newhope_schoolmanagenment.schemas import (
    ClassCreate,
    ClassRead,
    ClassStats,
    ClassUpdate,
    MessageResponse,
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


@router.get("/overview", response_model=list[ClassStats])
async def list_class_stats(
    current_dos: CurrentDOS, session: SessionDep
) -> list[ClassStats]:
    return await class_controller.list_class_stats(session)


@router.get("/{class_id}", response_model=ClassRead)
async def get_class(
    class_id: int, current_dos: CurrentDOS, session: SessionDep
) -> ClassRead:
    return await class_controller.get_class(session, class_id)


@router.get("/{class_id}/summary", response_model=ClassStats)
async def get_class_summary(
    class_id: int, current_dos: CurrentDOS, session: SessionDep
) -> ClassStats:
    return await class_controller.get_class_stats(session, class_id)


@router.patch("/{class_id}", response_model=ClassRead)
async def update_class(
    class_id: int,
    data: ClassUpdate,
    current_dos: CurrentDOS,
    session: SessionDep,
) -> ClassRead:
    return await class_controller.update_class(session, class_id, data)


@router.delete("/{class_id}", response_model=MessageResponse)
async def delete_class(
    class_id: int, current_dos: CurrentDOS, session: SessionDep
) -> MessageResponse:
    await class_controller.delete_class(session, class_id)
    return MessageResponse(message="Class deleted")
