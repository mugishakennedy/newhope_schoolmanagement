from contextlib import asynccontextmanager

from fastapi import FastAPI

from newhope_schoolmanagenment.api.routes import health, students
from newhope_schoolmanagenment.core import database


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()


app = FastAPI(title="Newhope School Management", lifespan=lifespan)

app.include_router(health.router)
app.include_router(students.router)


@app.get("/")
async def home():
    return {"message": "Welcome to Newhope School Management API"}
