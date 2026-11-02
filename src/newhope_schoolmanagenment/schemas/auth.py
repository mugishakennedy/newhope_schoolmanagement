from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["student", "teacher", "dos"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int


class MessageResponse(BaseModel):
    message: str


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=1, max_length=72)


class SessionUser(BaseModel):
    id: int
    full_name: str
    email: str
    role: Role
    registration_no: str | None = None
    class_id: int | None = None
    employee_code: str | None = None


class LoginResponse(TokenResponse):
    role: Role
    user: SessionUser


class SessionResponse(BaseModel):
    role: Role
    user: SessionUser
