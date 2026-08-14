from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.core.security import StaffPrincipal, get_current_staff, require_roles
from app.db.session import get_db
from app.models.entities import Lead, LeadNote, NewsArticle
from app.schemas.admin import CurrentStaff, StaffCreate, StaffOut, StaffUpdate, UploadSignRequest, UploadSignResponse
from app.schemas.common import PageMeta, Paginated
from app.schemas.lead import LeadOut, LeadUpdate
from app.schemas.news import NewsArticleOut, NewsCreate, NewsUpdate
from app.services.audit_service import write_audit
from app.services.news_service import archive_article, create_article, get_article, publish_article, unpublish_article, update_article
from app.services.storage_service import create_signed_upload, save_local_newsroom_image
from app.services.staff_service import create_staff, list_staff, update_staff

router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/me', response_model=CurrentStaff)
async def me(staff: StaffPrincipal = Depends(get_current_staff)):
    return CurrentStaff(id=staff.id, email=staff.email, full_name=staff.full_name, roles=sorted(staff.roles))


@router.get('/staff', response_model=list[StaffOut])
async def admin_staff_list(
    db: AsyncSession = Depends(get_db),
    _: StaffPrincipal = Depends(require_roles('admin')),
):
    return await list_staff(db)


@router.post('/staff', response_model=StaffOut, status_code=201)
async def admin_staff_create(
    payload: StaffCreate,
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(require_roles('admin')),
):
    result = await create_staff(
        db,
        email=str(payload.email),
        full_name=payload.full_name,
        password=payload.password,
        roles=payload.roles,
        granted_by=staff.id,
    )
    await write_audit(db, staff.id, 'staff.create', 'profile', result['id'], {'email': result['email'], 'roles': result['roles']})
    await db.commit()
    return result


@router.patch('/staff/{user_id}', response_model=StaffOut)
async def admin_staff_update(
    user_id: UUID,
    payload: StaffUpdate,
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(require_roles('admin')),
):
    result = await update_staff(
        db,
        user_id,
        full_name=payload.full_name,
        status=payload.status,
        roles=payload.roles,
        password=payload.password,
        actor_id=staff.id,
    )
    await write_audit(db, staff.id, 'staff.update', 'profile', user_id, {'status': result['status'], 'roles': result['roles']})
    await db.commit()
    return result


@router.get('/news', response_model=Paginated[NewsArticleOut])
async def admin_news(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status: str | None = None, q: str | None = None, db: AsyncSession = Depends(get_db), _: StaffPrincipal = Depends(require_roles('admin','editor','content_manager'))):
    filters = [NewsArticle.deleted_at.is_(None)]
    if status:
        filters.append(NewsArticle.status == status)
    if q:
        filters.append(NewsArticle.title.ilike(f'%{q}%'))
    total = await db.scalar(select(func.count()).select_from(NewsArticle).where(*filters)) or 0
    stmt = select(NewsArticle).options(selectinload(NewsArticle.categories)).where(*filters).order_by(NewsArticle.updated_at.desc()).offset((page-1)*page_size).limit(page_size)
    items = (await db.scalars(stmt)).unique().all()
    return {'items': items, 'meta': PageMeta(page=page, page_size=page_size, total=total, pages=(total+page_size-1)//page_size)}


@router.post('/news', response_model=NewsArticleOut, status_code=201)
async def admin_create_news(payload: NewsCreate, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','editor','content_manager'))):
    return await create_article(db, payload, staff.id)


@router.patch('/news/{article_id}', response_model=NewsArticleOut)
async def admin_update_news(article_id: UUID, payload: NewsUpdate, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','editor','content_manager'))):
    return await update_article(db, article_id, payload, staff.id)


@router.post('/news/{article_id}/publish', response_model=NewsArticleOut)
async def admin_publish_news(article_id: UUID, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','editor'))):
    return await publish_article(db, article_id, staff.id)


@router.post('/news/{article_id}/unpublish', response_model=NewsArticleOut)
async def admin_unpublish_news(article_id: UUID, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','editor'))):
    return await unpublish_article(db, article_id, staff.id)


@router.delete('/news/{article_id}', status_code=204)
async def admin_archive_news(article_id: UUID, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin'))):
    await archive_article(db, article_id, staff.id)
    return Response(status_code=204)


@router.get('/leads', response_model=Paginated[LeadOut])
async def admin_leads(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100), status: str | None = None, project_id: UUID | None = None, assigned_to: UUID | None = None, db: AsyncSession = Depends(get_db), _: StaffPrincipal = Depends(require_roles('admin','sales'))):
    filters = [Lead.deleted_at.is_(None)]
    if status: filters.append(Lead.status == status)
    if project_id: filters.append(Lead.project_id == project_id)
    if assigned_to: filters.append(Lead.assigned_to == assigned_to)
    total = await db.scalar(select(func.count()).select_from(Lead).where(*filters)) or 0
    stmt = select(Lead).options(selectinload(Lead.notes)).where(*filters).order_by(Lead.created_at.desc()).offset((page-1)*page_size).limit(page_size)
    items = (await db.scalars(stmt)).unique().all()
    return {'items': items, 'meta': PageMeta(page=page, page_size=page_size, total=total, pages=(total+page_size-1)//page_size)}


@router.patch('/leads/{lead_id}', response_model=LeadOut)
async def admin_update_lead(lead_id: UUID, payload: LeadUpdate, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','sales'))):
    lead = await db.scalar(select(Lead).options(selectinload(Lead.notes)).where(Lead.id == lead_id, Lead.deleted_at.is_(None)))
    if not lead:
        raise AppError('lead_not_found', 'Lead not found.', 404)
    before = {'status': lead.status, 'assigned_to': str(lead.assigned_to) if lead.assigned_to else None}
    if payload.status is not None:
        allowed = {'new','contacted','qualified','viewing_scheduled','converted','lost','spam'}
        if payload.status not in allowed:
            raise AppError('invalid_lead_status', 'Invalid lead status.', 400)
        lead.status = payload.status
    if 'assigned_to' in payload.model_fields_set:
        lead.assigned_to = payload.assigned_to
    if payload.note:
        db.add(LeadNote(lead_id=lead.id, staff_id=staff.id, note=payload.note))
    await write_audit(db, staff.id, 'lead.update', 'lead', lead.id, {'before': before, 'after': {'status': lead.status, 'assigned_to': str(lead.assigned_to) if lead.assigned_to else None}})
    await db.commit()
    return await db.scalar(select(Lead).options(selectinload(Lead.notes)).where(Lead.id == lead.id))


@router.post('/uploads/newsroom-image')
async def upload_newsroom_image(
    request: Request,
    file: UploadFile = File(...),
    _: StaffPrincipal = Depends(require_roles('admin','editor','content_manager')),
):
    public_path = await save_local_newsroom_image(file)
    base = str(request.base_url).rstrip('/')
    return {'url': f'{base}{public_path}', 'path': public_path}


@router.post('/uploads/sign', response_model=UploadSignResponse)
async def sign_upload(payload: UploadSignRequest, staff: StaffPrincipal = Depends(require_roles('admin','editor'))):
    data = create_signed_upload(payload.filename, payload.content_type, payload.size_bytes, payload.folder)
    return UploadSignResponse(**data)
