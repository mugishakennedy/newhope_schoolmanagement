from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

from newhope_schoolmanagenment.api.routes import (
    assignments,
    auth,
    classes,
    dashboard,
    dos_accounts,
    dos_auth,
    health,
    modules,
    students,
    submissions,
    teachers,
)
from newhope_schoolmanagenment.controllers import dos as dos_controller
from newhope_schoolmanagenment.core import database
from newhope_schoolmanagenment.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    async with database.session_scope() as session:
        await dos_controller.ensure_default_dos(session)
    yield
    await database.disconnect()


settings = get_settings()

app = FastAPI(title="Newhope School Management", lifespan=lifespan)

if settings.enforce_https:
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    if settings.enforce_https:
        response.headers.setdefault(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains",
        )
    return response


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(dos_auth.router)
app.include_router(dos_accounts.router)
app.include_router(teachers.router)
app.include_router(classes.router)
app.include_router(modules.router)
app.include_router(assignments.router)
app.include_router(submissions.router)
app.include_router(dashboard.router)


@app.get("/")
async def home():
    return {"message": "Welcome to Newhope School Management API"}
