from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from newhope_schoolmanagenment.core.config import get_settings

_CHUNK_SIZE = 1024 * 1024
_MAX_NAME_LENGTH = 255
_DEFAULT_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".odt",
    ".rtf",
    ".txt",
    ".md",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".zip",
    ".py",
    ".js",
    ".ts",
    ".java",
    ".c",
    ".cpp",
    ".css",
}


@dataclass(frozen=True)
class SavedFile:
    url: str
    original_name: str
    content_type: str | None
    size_bytes: int


def upload_root() -> Path:
    root = Path(get_settings().upload_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _allowed_extensions() -> set[str]:
    configured = get_settings().allowed_upload_extensions
    if not configured.strip():
        return set(_DEFAULT_EXTENSIONS)
    return {
        item.strip().lower()
        for item in configured.split(",")
        if item.strip()
    }


def _safe_filename(original: str | None) -> tuple[str, str]:
    suffix = Path(original or "").suffix.lower()
    if suffix not in _allowed_extensions():
        allowed = ", ".join(sorted(_allowed_extensions()))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed types: {allowed}",
        )
    return f"{uuid4().hex}{suffix}", suffix


def _display_name(original: str | None) -> str:
    name = Path(original or "").name.strip()
    if not name:
        return "file"
    return name[:_MAX_NAME_LENGTH]


async def _save_upload(upload: UploadFile, subdir: str) -> SavedFile:
    settings = get_settings()
    filename, _ = _safe_filename(upload.filename)
    max_bytes = settings.max_upload_mb * 1024 * 1024

    destination = upload_root() / subdir
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / filename

    total = 0
    try:
        with target.open("wb") as handle:
            while chunk := await upload.read(_CHUNK_SIZE):
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            "File is too large. Maximum size is "
                            f"{settings.max_upload_mb} MB"
                        ),
                    )
                handle.write(chunk)
    except HTTPException:
        target.unlink(missing_ok=True)
        raise
    except OSError as exc:
        target.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the uploaded file",
        ) from exc
    finally:
        await upload.close()

    if total == 0:
        target.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty",
        )

    return SavedFile(
        url=f"/uploads/{subdir}/{filename}",
        original_name=_display_name(upload.filename),
        content_type=upload.content_type,
        size_bytes=total,
    )


async def save_submission_file(upload: UploadFile) -> str:
    saved = await _save_upload(upload, "submissions")
    return saved.url


async def save_assignment_file(upload: UploadFile) -> SavedFile:
    return await _save_upload(upload, "assignments")


def delete_uploaded_file(url: str | None) -> None:
    if not url or not url.startswith("/uploads/"):
        return

    root = upload_root()
    relative = url.removeprefix("/uploads/").lstrip("/")
    candidate = (root / relative).resolve()
    if root not in candidate.parents and candidate != root:
        return
    candidate.unlink(missing_ok=True)
