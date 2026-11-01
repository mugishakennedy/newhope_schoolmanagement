from fastapi import APIRouter, Depends, HTTPException, Response, status

from newhope_schoolmanagenment.api.deps import (
    CurrentStudent,
    SessionDep,
    get_current_student,
    login_rate_limit,
    register_rate_limit,
)
from newhope_schoolmanagenment.api.tokens import (
    issue_token_response,
    set_refresh_cookie,
)
from newhope_schoolmanagenment.controllers import student as student_controller
from newhope_schoolmanagenment.schemas import (
    StudentLoginRequest,
    StudentLoginResponse,
    StudentRegistrationCreate,
    StudentRegistrationRead,
)

router = APIRouter(prefix="/students", tags=["students"])


@router.post(
    "/register",
    response_model=StudentRegistrationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(register_rate_limit)],
)
async def register_student(
    data: StudentRegistrationCreate, session: SessionDep
) -> StudentRegistrationRead:
    return await student_controller.create_student(session, data)


@router.post(
    "/login",
    response_model=StudentLoginResponse,
    dependencies=[Depends(login_rate_limit)],
)
async def login_student(
    data: StudentLoginRequest, response: Response, session: SessionDep
) -> StudentLoginResponse:
    student = await student_controller.authenticate_student(
        session, data.email, data.password
    )
    token_response, refresh_token = issue_token_response(student.id)
    set_refresh_cookie(response, refresh_token)
    return StudentLoginResponse(
        message="Login successful",
        student=student,
        access_token=token_response.access_token,
        expires_in=token_response.expires_in,
        refresh_expires_in=token_response.refresh_expires_in,
    )


@router.get(
    "",
    response_model=list[StudentRegistrationRead],
    dependencies=[Depends(get_current_student)],
)
async def list_students(session: SessionDep) -> list[StudentRegistrationRead]:
    return await student_controller.list_students(session)


@router.get("/{student_id}", response_model=StudentRegistrationRead)
async def get_student(
    student_id: int, current_student: CurrentStudent, session: SessionDep
) -> StudentRegistrationRead:
    if current_student.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own student record",
        )
    return await student_controller.get_student(session, student_id)
