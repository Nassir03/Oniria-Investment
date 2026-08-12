from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar('T')


class ErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    field_errors: dict[str, list[str]] | None = None


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int
    pages: int


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    meta: PageMeta
