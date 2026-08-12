from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    name: str


class NewsArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    slug: str
    title: str
    excerpt: str | None
    body: dict
    hero_image_url: str | None
    hero_image_alt: str | None
    status: str
    published_at: datetime | None
    author_id: UUID | None
    seo_title: str | None
    meta_description: str | None
    og_image_url: str | None
    categories: list[CategoryOut] = []
    created_at: datetime
    updated_at: datetime


class NewsCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=180, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    title: str = Field(min_length=2, max_length=300)
    excerpt: str | None = Field(default=None, max_length=1000)
    body: dict = Field(default_factory=dict)
    hero_image_url: str | None = None
    hero_image_alt: str | None = Field(default=None, max_length=500)
    category_ids: list[UUID] = Field(default_factory=list)
    seo_title: str | None = Field(default=None, max_length=70)
    meta_description: str | None = Field(default=None, max_length=180)
    og_image_url: str | None = None
    scheduled_for: datetime | None = None


class NewsUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=2, max_length=180, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    title: str | None = Field(default=None, min_length=2, max_length=300)
    excerpt: str | None = Field(default=None, max_length=1000)
    body: dict | None = None
    hero_image_url: str | None = None
    hero_image_alt: str | None = Field(default=None, max_length=500)
    category_ids: list[UUID] | None = None
    seo_title: str | None = Field(default=None, max_length=70)
    meta_description: str | None = Field(default=None, max_length=180)
    og_image_url: str | None = None
    scheduled_for: datetime | None = None
