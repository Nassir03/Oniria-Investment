from pydantic import BaseModel, Field


class PageViewCreate(BaseModel):
    path: str = Field(min_length=1, max_length=500)
    session_id: str | None = Field(default=None, max_length=120)
    referrer: str | None = Field(default=None, max_length=1000)
