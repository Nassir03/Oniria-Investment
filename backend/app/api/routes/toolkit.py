from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import ProjectToolkitAsset
from app.schemas.common import PageMeta, Paginated
from app.schemas.toolkit import ToolkitAssetOut

router = APIRouter(prefix='/toolkit-assets', tags=['toolkit'])


@router.get('', response_model=Paginated[ToolkitAssetOut])
async def public_toolkit_assets(
    project_slug: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = [ProjectToolkitAsset.is_public.is_(True)]
    if project_slug:
        filters.append(ProjectToolkitAsset.project_slug == project_slug)
    total = await db.scalar(select(func.count()).select_from(ProjectToolkitAsset).where(*filters)) or 0
    items = (await db.scalars(
        select(ProjectToolkitAsset)
        .where(*filters)
        .order_by(ProjectToolkitAsset.project_slug, ProjectToolkitAsset.sort_order, ProjectToolkitAsset.title)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).all()
    pages = (total + page_size - 1) // page_size
    return {'items': items, 'meta': PageMeta(page=page, page_size=page_size, total=total, pages=pages)}
