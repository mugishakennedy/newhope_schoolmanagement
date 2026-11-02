from fastapi import APIRouter

from newhope_schoolmanagenment.api.deps import SessionDep
from newhope_schoolmanagenment.controllers import class_ as class_controller
from newhope_schoolmanagenment.schemas.classes import ClassRead

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/classes", response_model=list[ClassRead])
async def list_public_classes(session: SessionDep) -> list[ClassRead]:
    return await class_controller.list_classes(session)
