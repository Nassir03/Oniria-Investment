from datetime import datetime
from uuid import UUID
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator

ALLOWED_CATEGORIES = {
    'gallery', 'logo', 'project_brief', 'brochure', 'floor_plans',
    'project_film', 'payment_plan', 'material_boards', 'masterplan',
}
ALLOWED_MEDIA_TYPES = {'image', 'pdf', 'video', 'document'}


def _safe_toolkit_url(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError('Toolkit link cannot be empty.')
    if value.startswith('/') and not value.startswith('//'):
        return value

    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise ValueError('Toolkit links must be valid HTTP(S) URLs or site-relative paths.')
    return value


class ToolkitAssetBase(BaseModel):
    project_id: UUID | None = None
    project_slug: str = Field(default='all-projects', min_length=1, max_length=160)
    category: str
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    file_url: str = Field(min_length=1)
    preview_image_url: str | None = None
    storage_path: str | None = None
    preview_storage_path: str | None = None
    media_type: str = 'image'
    file_name: str | None = Field(default=None, max_length=300)
    file_size: int | None = Field(default=None, ge=0)
    is_public: bool = True
    is_downloadable: bool = True
    sort_order: int = 0

    @field_validator('file_url')
    @classmethod
    def valid_file_url(cls, value: str) -> str:
        return _safe_toolkit_url(value)

    @field_validator('preview_image_url')
    @classmethod
    def valid_preview_image_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return _safe_toolkit_url(value)

    @field_validator('category')
    @classmethod
    def valid_category(cls, value: str) -> str:
        if value not in ALLOWED_CATEGORIES:
            raise ValueError('Unsupported toolkit category.')
        return value

    @field_validator('media_type')
    @classmethod
    def valid_media_type(cls, value: str) -> str:
        if value not in ALLOWED_MEDIA_TYPES:
            raise ValueError('Unsupported toolkit media type.')
        return value


class ToolkitAssetCreate(ToolkitAssetBase):
    pass


class ToolkitAssetUpdate(BaseModel):
    project_id: UUID | None = None
    project_slug: str | None = Field(default=None, min_length=1, max_length=160)
    category: str | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    file_url: str | None = None
    preview_image_url: str | None = None
    storage_path: str | None = None
    preview_storage_path: str | None = None
    media_type: str | None = None
    file_name: str | None = Field(default=None, max_length=300)
    file_size: int | None = Field(default=None, ge=0)
    is_public: bool | None = None
    is_downloadable: bool | None = None
    sort_order: int | None = None

    @field_validator('file_url')
    @classmethod
    def valid_file_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _safe_toolkit_url(value)

    @field_validator('preview_image_url')
    @classmethod
    def valid_preview_image_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return _safe_toolkit_url(value)

    @field_validator('category')
    @classmethod
    def valid_category(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_CATEGORIES:
            raise ValueError('Unsupported toolkit category.')
        return value

    @field_validator('media_type')
    @classmethod
    def valid_media_type(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_MEDIA_TYPES:
            raise ValueError('Unsupported toolkit media type.')
        return value


class ToolkitAssetOut(ToolkitAssetBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime
