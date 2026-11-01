from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Module,
    Student,
    Submission,
    Teacher,
)


async def get_dashboard(session: AsyncSession) -> dict[str, int]:
    async def count(model) -> int:
        value = await session.scalar(select(func.count()).select_from(model))
        return int(value or 0)

    ungraded = await session.scalar(
        select(func.count())
        .select_from(Submission)
        .where(Submission.grade.is_(None))
    )

    return {
        "students": await count(Student),
        "teachers": await count(Teacher),
        "classes": await count(Class),
        "modules": await count(Module),
        "assignments": await count(Assignment),
        "submissions": await count(Submission),
        "ungraded_submissions": int(ungraded or 0),
    }
