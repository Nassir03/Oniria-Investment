from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import Project, ProjectStatus
from app.schemas.common import PageMeta, Paginated
from app.schemas.project import ProjectOut

router = APIRouter(prefix='/projects', tags=['projects'])


@router.get('', response_model=Paginated[ProjectOut])
async def list_projects(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: AsyncSession = Depends(get_db)):
    base = select(Project).options(selectinload(Project.media)).where(Project.status == ProjectStatus.published.value)
    total = await db.scalar(select(func.count()).select_from(Project).where(Project.status == ProjectStatus.published.value)) or 0
    items = (await db.scalars(base.order_by(Project.sort_order, Project.name).offset((page-1)*page_size).limit(page_size))).unique().all()
    pages = (total + page_size - 1) // page_size
    return {'items': items, 'meta': PageMeta(page=page, page_size=page_size, total=total, pages=pages)}


@router.get('/{slug}', response_model=ProjectOut)
async def project_detail(slug: str, db: AsyncSession = Depends(get_db)):
    project = await db.scalar(select(Project).options(selectinload(Project.media)).where(Project.slug == slug, Project.status == ProjectStatus.published.value))
    if not project:
        raise AppError('project_not_found', 'Project not found.', 404)
    return project
