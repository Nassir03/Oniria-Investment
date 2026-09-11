from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.models.entities import ArticleStatus, NewsArticle, NewsCategory
from app.schemas.news import NewsCreate, NewsUpdate
from app.services.audit_service import write_audit


async def get_article(db: AsyncSession, article_id: UUID) -> NewsArticle:
    article = await db.scalar(
        select(NewsArticle)
        .options(selectinload(NewsArticle.categories))
        .where(NewsArticle.id == article_id, NewsArticle.deleted_at.is_(None))
    )
    if not article:
        raise AppError('article_not_found', 'News article not found.', 404)
    return article


async def _load_categories(db: AsyncSession, ids: list[UUID]) -> list[NewsCategory]:
    """Load category objects explicitly so async ORM never needs a lazy load.

    With SQLAlchemy AsyncSession, assigning to an unloaded relationship on a
    persistent object can trigger implicit database IO and raise MissingGreenlet.
    All category reads therefore happen explicitly with await before assigning
    the relationship.
    """
    if not ids:
        return []

    unique_ids = list(dict.fromkeys(ids))
    categories = (await db.scalars(select(NewsCategory).where(NewsCategory.id.in_(unique_ids)))).all()
    if len(categories) != len(unique_ids):
        raise AppError('invalid_categories', 'One or more categories do not exist.', 400)
    return list(categories)


async def create_article(db: AsyncSession, payload: NewsCreate, actor_id: UUID) -> NewsArticle:
    if await db.scalar(select(NewsArticle.id).where(NewsArticle.slug == payload.slug)):
        raise AppError('slug_exists', 'An article with this slug already exists.', 409)

    # Resolve categories BEFORE the new article is flushed. At this point the
    # relationship is safe to populate because the object is still transient,
    # so SQLAlchemy will not attempt a lazy load behind AsyncSession's back.
    categories = await _load_categories(db, payload.category_ids)

    article = NewsArticle(
        slug=payload.slug,
        title=payload.title,
        excerpt=payload.excerpt,
        body=payload.body,
        hero_image_url=payload.hero_image_url,
        hero_image_alt=payload.hero_image_alt,
        seo_title=payload.seo_title,
        meta_description=payload.meta_description,
        og_image_url=payload.og_image_url,
        author_id=actor_id,
        created_by=actor_id,
        updated_by=actor_id,
        status=ArticleStatus.scheduled.value if payload.scheduled_for else ArticleStatus.draft.value,
        published_at=payload.scheduled_for,
        categories=categories,
    )
    db.add(article)
    await db.flush()
    await write_audit(db, actor_id, 'news.create', 'news_article', article.id, {'slug': article.slug})
    await db.commit()
    return await get_article(db, article.id)


async def update_article(db: AsyncSession, article_id: UUID, payload: NewsUpdate, actor_id: UUID) -> NewsArticle:
    # get_article uses selectinload, so article.categories is already loaded and
    # can be replaced without implicit async IO.
    article = await get_article(db, article_id)
    data = payload.model_dump(exclude_unset=True)
    category_ids = data.pop('category_ids', None)
    scheduled_for = data.pop('scheduled_for', None) if 'scheduled_for' in data else None

    if 'slug' in data and data['slug'] != article.slug:
        if await db.scalar(
            select(NewsArticle.id).where(NewsArticle.slug == data['slug'], NewsArticle.id != article.id)
        ):
            raise AppError('slug_exists', 'An article with this slug already exists.', 409)

    for key, value in data.items():
        setattr(article, key, value)

    if category_ids is not None:
        article.categories = await _load_categories(db, category_ids)

    if 'scheduled_for' in payload.model_fields_set:
        article.published_at = scheduled_for
        article.status = ArticleStatus.scheduled.value if scheduled_for else ArticleStatus.draft.value

    article.updated_by = actor_id
    await write_audit(db, actor_id, 'news.update', 'news_article', article.id)
    await db.commit()
    return await get_article(db, article.id)


async def publish_article(db: AsyncSession, article_id: UUID, actor_id: UUID) -> NewsArticle:
    article = await get_article(db, article_id)
    article.status = ArticleStatus.published.value
    article.published_at = datetime.now(timezone.utc)
    article.updated_by = actor_id
    await write_audit(db, actor_id, 'news.publish', 'news_article', article.id)
    await db.commit()
    return await get_article(db, article.id)


async def unpublish_article(db: AsyncSession, article_id: UUID, actor_id: UUID) -> NewsArticle:
    article = await get_article(db, article_id)
    article.status = ArticleStatus.draft.value
    article.published_at = None
    article.updated_by = actor_id
    await write_audit(db, actor_id, 'news.unpublish', 'news_article', article.id)
    await db.commit()
    return await get_article(db, article.id)


async def archive_article(db: AsyncSession, article_id: UUID, actor_id: UUID) -> None:
    article = await get_article(db, article_id)
    article.status = ArticleStatus.archived.value
    article.deleted_at = datetime.now(timezone.utc)
    article.updated_by = actor_id
    await write_audit(db, actor_id, 'news.archive', 'news_article', article.id)
    await db.commit()
