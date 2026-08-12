from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import ArticleStatus, NewsArticle
from app.schemas.common import PageMeta, Paginated
from app.schemas.news import NewsArticleOut

router = APIRouter(prefix='/news', tags=['news'])


def public_news_filter():
    now = datetime.now(timezone.utc)
    return (NewsArticle.status == ArticleStatus.published.value, NewsArticle.deleted_at.is_(None), NewsArticle.published_at <= now)


@router.get('', response_model=Paginated[NewsArticleOut])
async def list_news(page: int = Query(1, ge=1), page_size: int = Query(12, ge=1, le=100), q: str | None = None, db: AsyncSession = Depends(get_db)):
    filters = list(public_news_filter())
    if q:
        filters.append(or_(NewsArticle.title.ilike(f'%{q}%'), NewsArticle.excerpt.ilike(f'%{q}%')))
    total = await db.scalar(select(func.count()).select_from(NewsArticle).where(*filters)) or 0
    stmt = select(NewsArticle).options(selectinload(NewsArticle.categories)).where(*filters).order_by(NewsArticle.published_at.desc()).offset((page-1)*page_size).limit(page_size)
    items = (await db.scalars(stmt)).unique().all()
    return {'items': items, 'meta': PageMeta(page=page, page_size=page_size, total=total, pages=(total+page_size-1)//page_size)}


@router.get('/{slug}', response_model=NewsArticleOut)
async def news_detail(slug: str, db: AsyncSession = Depends(get_db)):
    article = await db.scalar(select(NewsArticle).options(selectinload(NewsArticle.categories)).where(NewsArticle.slug == slug, *public_news_filter()))
    if not article:
        raise AppError('article_not_found', 'News article not found.', 404)
    return article
