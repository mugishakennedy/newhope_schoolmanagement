import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from newhope_schoolmanagenment.core import database
from newhope_schoolmanagenment.core.security import hash_password
from newhope_schoolmanagenment.models import (
    Assignment,
    Class,
    Module,
    Student,
    Teacher,
)

DEMO_PASSWORD = "ChangeMe123!"
ACADEMIC_YEAR = "2026-2027"


async def _get_class(
    session: AsyncSession, class_name: str, academic_year: str
) -> Class:
    result = await session.execute(
        select(Class).where(
            Class.class_name == class_name,
            Class.academic_year == academic_year,
        )
    )
    school_class = result.scalar_one_or_none()
    if school_class is None:
        school_class = Class(class_name=class_name, academic_year=academic_year)
        session.add(school_class)
        await session.flush()
    return school_class


async def _get_module(
    session: AsyncSession,
    module_code: str,
    module_name: str,
    description: str,
) -> Module:
    result = await session.execute(
        select(Module).where(Module.module_code == module_code)
    )
    module = result.scalar_one_or_none()
    if module is None:
        module = Module(
            module_code=module_code,
            module_name=module_name,
            description=description,
        )
        session.add(module)
        await session.flush()
    return module


async def _get_teacher(
    session: AsyncSession,
    full_name: str,
    email: str,
    employee_code: str,
) -> Teacher:
    result = await session.execute(
        select(Teacher).where(Teacher.employee_code == employee_code)
    )
    teacher = result.scalar_one_or_none()
    if teacher is None:
        teacher = Teacher(
            full_name=full_name,
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            employee_code=employee_code,
        )
        session.add(teacher)
        await session.flush()
    return teacher


async def _get_assignment(
    session: AsyncSession,
    teacher: Teacher,
    module: Module,
    school_class: Class,
    title: str,
    description: str,
    deadline: datetime,
) -> Assignment:
    result = await session.execute(
        select(Assignment).where(
            Assignment.teacher_id == teacher.id,
            Assignment.module_id == module.id,
            Assignment.class_id == school_class.id,
            Assignment.title == title,
        )
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        assignment = Assignment(
            teacher_id=teacher.id,
            module_id=module.id,
            class_id=school_class.id,
            title=title,
            description=description,
            deadline=deadline,
        )
        session.add(assignment)
        await session.flush()
    return assignment


async def _get_student(
    session: AsyncSession,
    full_name: str,
    email: str,
    registration_no: str,
    school_class: Class,
) -> Student:
    result = await session.execute(select(Student).where(Student.email == email))
    student = result.scalar_one_or_none()
    if student is None:
        student = Student(
            full_name=full_name,
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            registration_no=registration_no,
            class_id=school_class.id,
        )
        session.add(student)
        await session.flush()
    return student


async def seed(session: AsyncSession) -> None:
    school_class = await _get_class(session, "Senior 1", ACADEMIC_YEAR)

    modules = [
        await _get_module(
            session,
            "MATH101",
            "Mathematics",
            "Core mathematics for Senior 1",
        ),
        await _get_module(
            session,
            "ENG101",
            "English",
            "Reading, writing, and comprehension",
        ),
        await _get_module(
            session,
            "CS101",
            "Computer Science",
            "Programming and computer fundamentals",
        ),
    ]
    teachers = [
        await _get_teacher(session, "Alice Teacher", "alice@newhope.test", "NH-T-001"),
        await _get_teacher(session, "Bob Teacher", "bob@newhope.test", "NH-T-002"),
        await _get_teacher(session, "Carol Teacher", "carol@newhope.test", "NH-T-003"),
    ]

    deadline = datetime.now(UTC) + timedelta(days=14)
    for teacher, module in zip(teachers, modules, strict=True):
        await _get_assignment(
            session,
            teacher,
            module,
            school_class,
            f"{module.module_name} assignment 1",
            f"Complete the first {module.module_name} assignment.",
            deadline,
        )

    await _get_student(
        session,
        "Demo Student",
        "student@newhope.test",
        "NH-S-0001",
        school_class,
    )

    await session.commit()


async def main() -> None:
    await database.connect()
    try:
        session_factory = database.get_session_factory()
        async with session_factory() as session:
            await seed(session)
    finally:
        await database.disconnect()

    print("Seed data ready.")
    print("Student: student@newhope.test")
    print(f"Password for all seeded accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
