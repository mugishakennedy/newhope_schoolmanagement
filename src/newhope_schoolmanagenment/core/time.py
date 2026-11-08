from datetime import UTC, datetime


def utcnow() -> datetime:
    """Return the current UTC time as a naive datetime.

    Database columns in this project use ``TIMESTAMP WITHOUT TIME ZONE``, so
    values written to them must be timezone-naive to avoid asyncpg errors.
    """
    return datetime.now(UTC).replace(tzinfo=None)
