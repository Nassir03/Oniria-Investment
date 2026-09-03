from __future__ import annotations

from datetime import datetime
from enum import StrEnum
import uuid

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class StaffRole(StrEnum):
    admin = 'admin'
    editor = 'editor'
    content_manager = 'content_manager'
    sales = 'sales'


class ProfileStatus(StrEnum):
    active = 'active'
    suspended = 'suspended'


class ProjectStatus(StrEnum):
    draft = 'draft'
    published = 'published'
    archived = 'archived'


class ArticleStatus(StrEnum):
    draft = 'draft'
    scheduled = 'scheduled'
    published = 'published'
    archived = 'archived'


class LeadStatus(StrEnum):
    new = 'new'
    contacted = 'contacted'
    qualified = 'qualified'
    viewing_scheduled = 'viewing_scheduled'
    converted = 'converted'
    lost = 'lost'
    spam = 'spam'


class Profile(Base, TimestampMixin):
    __tablename__ = 'profiles'
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    full_name: Mapped[str | None] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(320), index=True)
    phone: Mapped[str | None] = mapped_column(String(60))
    job_title: Mapped[str | None] = mapped_column(String(120))
    department: Mapped[str | None] = mapped_column(String(120))
    preferred_contact_method: Mapped[str | None] = mapped_column(String(30))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    notification_preferences: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ProfileStatus.active.value, nullable=False)


class StaffRoleAssignment(Base):
    __tablename__ = 'staff_roles'
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='CASCADE'), primary_key=True)
    role: Mapped[str] = mapped_column(String(30), primary_key=True)
    granted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default='now()')


class Project(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'projects'
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str | None] = mapped_column(String(100))
    location: Mapped[str | None] = mapped_column(String(250))
    summary: Mapped[str | None] = mapped_column(Text)
    body: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default=ProjectStatus.draft.value, index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    media: Mapped[list[ProjectMedia]] = relationship(back_populates='project', cascade='all, delete-orphan', order_by='ProjectMedia.sort_order')


class ProjectMedia(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'project_media'
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    url: Mapped[str] = mapped_column(Text)
    alt_text: Mapped[str] = mapped_column(String(500))
    media_type: Mapped[str] = mapped_column(String(30), default='image')
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    is_concept: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    project: Mapped[Project] = relationship(back_populates='media')


class BusinessArea(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'business_areas'
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str | None] = mapped_column(Text)
    body: Mapped[dict | None] = mapped_column(JSON)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class NewsArticle(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'news_articles'
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    excerpt: Mapped[str | None] = mapped_column(Text)
    body: Mapped[dict] = mapped_column(JSON, default=dict)
    hero_image_url: Mapped[str | None] = mapped_column(Text)
    hero_image_alt: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default=ArticleStatus.draft.value, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    author_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'))
    seo_title: Mapped[str | None] = mapped_column(String(70))
    meta_description: Mapped[str | None] = mapped_column(String(180))
    og_image_url: Mapped[str | None] = mapped_column(Text)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    categories: Mapped[list[NewsCategory]] = relationship(secondary='news_article_categories', back_populates='articles')


class NewsCategory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'news_categories'
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    articles: Mapped[list[NewsArticle]] = relationship(secondary='news_article_categories', back_populates='categories')


class NewsArticleCategory(Base):
    __tablename__ = 'news_article_categories'
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('news_articles.id', ondelete='CASCADE'), primary_key=True)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('news_categories.id', ondelete='CASCADE'), primary_key=True)


class Lead(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'leads'
    reference_no: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    source: Mapped[str] = mapped_column(String(50), default='website', nullable=False)
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='SET NULL'), index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(320), index=True)
    phone: Mapped[str | None] = mapped_column(String(60))
    country: Mapped[str | None] = mapped_column(String(120))
    enquiry_type: Mapped[str | None] = mapped_column(String(100))
    preferred_contact_method: Mapped[str | None] = mapped_column(String(30))
    message: Mapped[str] = mapped_column(Text)
    consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=LeadStatus.new.value, index=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'), index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[list[LeadNote]] = relationship(back_populates='lead', cascade='all, delete-orphan', order_by='LeadNote.created_at')


class LeadNote(Base, UUIDPrimaryKeyMixin):
    __tablename__ = 'lead_notes'
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('leads.id', ondelete='CASCADE'), index=True)
    staff_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'))
    note: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()', nullable=False)
    lead: Mapped[Lead] = relationship(back_populates='notes')


class SiteSetting(Base):
    __tablename__ = 'site_settings'
    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value_json: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()', nullable=False)


class SiteVisit(Base, UUIDPrimaryKeyMixin):
    __tablename__ = 'site_visits'
    path: Mapped[str] = mapped_column(String(500), index=True)
    session_id: Mapped[str | None] = mapped_column(String(120), index=True)
    referrer: Mapped[str | None] = mapped_column(Text)
    user_agent: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()', nullable=False, index=True)


class AuditLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = 'audit_log'
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='SET NULL'), index=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()', nullable=False, index=True)


class AdminNotification(Base, UUIDPrimaryKeyMixin):
    __tablename__ = 'admin_notifications'
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('profiles.id', ondelete='CASCADE'), index=True)
    type: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(String(500))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default='now()', nullable=False, index=True)


Index('ix_news_status_published_desc', NewsArticle.status, NewsArticle.published_at.desc())
Index('ix_leads_status_created_desc', Lead.status, Lead.created_at.desc())
Index('ix_admin_notifications_user_read_created', AdminNotification.user_id, AdminNotification.is_read, AdminNotification.created_at.desc())


class ProjectToolkitAsset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = 'project_toolkit_assets'
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    project_slug: Mapped[str] = mapped_column(String(160), default='all-projects', index=True)
    category: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    file_url: Mapped[str] = mapped_column(Text)
    preview_image_url: Mapped[str | None] = mapped_column(Text)
    storage_path: Mapped[str | None] = mapped_column(Text)
    preview_storage_path: Mapped[str | None] = mapped_column(Text)
    media_type: Mapped[str] = mapped_column(String(30), default='image')
    file_name: Mapped[str | None] = mapped_column(String(300))
    file_size: Mapped[int | None] = mapped_column(Integer)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_downloadable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
