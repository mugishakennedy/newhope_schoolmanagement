from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    uploaded_by_teacher_id: int | None
    original_name: str
    content_url: str
    content_type: str | None
    size_bytes: int
    created_at: datetime
