from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ProjectMediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    url: str
    alt_text: str
    media_type: str
    width: int | None
    height: int | None
    is_concept: bool
    sort_order: int


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    name: str
    category: str | None
    location: str | None
    summary: str | None
    body: dict | None
    status: str
    featured: bool
    sort_order: int
    media: list[ProjectMediaOut] = []
    created_at: datetime
    updated_at: datetime
