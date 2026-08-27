from datetime import datetime, timedelta, timezone
from io import BytesIO, StringIO
import csv
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile
from sqlalchemy import cast, Date, func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError
from app.core.security import StaffPrincipal, get_current_staff, require_roles
from app.db.session import get_db
from app.models.entities import Lead, LeadNote, NewsArticle, Profile, SiteVisit
from app.schemas.admin import AdminNotificationList, CurrentStaff, ProfileUpdate, StaffCreate, StaffOut, StaffUpdate, UploadSignRequest, UploadSignResponse
from app.schemas.common import PageMeta, Paginated
from app.schemas.lead import LeadOut, LeadUpdate
from app.schemas.news import NewsArticleOut, NewsCreate, NewsUpdate
from app.services.audit_service import write_audit
from app.services.news_service import archive_article, create_article, get_article, publish_article, unpublish_article, update_article
from app.services.notification_service import (
    create_preference_notifications,
    list_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    normalize_notification_preferences,
)
from app.services.storage_service import create_signed_upload, save_local_newsroom_image, save_local_profile_image
from app.services.staff_service import create_staff, list_staff, update_staff
from fastapi.responses import StreamingResponse

router = APIRouter(prefix='/admin', tags=['admin'])


async def _analytics_summary(db: AsyncSession, days: int = 30):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days - 1)
    month_start = now - timedelta(days=365)

    daily_rows = (await db.execute(
        select(
            cast(SiteVisit.created_at, Date).label('day'),
            func.count(SiteVisit.id).label('views'),
            func.count(func.distinct(SiteVisit.session_id)).label('visitors'),
        )
        .where(SiteVisit.created_at >= start)
        .group_by(cast(SiteVisit.created_at, Date))
        .order_by(cast(SiteVisit.created_at, Date))
    )).all()

    month_expr = func.date_trunc(literal_column("'month'"), SiteVisit.created_at)
    monthly_rows = (await db.execute(
        select(
            month_expr.label('month'),
            func.count(SiteVisit.id).label('views'),
            func.count(func.distinct(SiteVisit.session_id)).label('visitors'),
        )
        .where(SiteVisit.created_at >= month_start)
        .group_by(month_expr)
        .order_by(month_expr)
    )).all()

    top_pages = (await db.execute(
        select(SiteVisit.path, func.count(SiteVisit.id).label('views'))
        .where(SiteVisit.created_at >= start)
        .group_by(SiteVisit.path)
        .order_by(func.count(SiteVisit.id).desc())
        .limit(6)
    )).all()

    totals = (await db.execute(
        select(
            func.count(SiteVisit.id).label('views'),
            func.count(func.distinct(SiteVisit.session_id)).label('visitors'),
        ).where(SiteVisit.created_at >= start)
    )).one()

    return {
        'period_days': days,
        'total_views': totals.views or 0,
        'unique_visitors': totals.visitors or 0,
        'daily': [{'label': row.day.isoformat(), 'views': row.views, 'visitors': row.visitors} for row in daily_rows],
        'monthly': [{'label': row.month.strftime('%Y-%m'), 'views': row.views, 'visitors': row.visitors} for row in monthly_rows],
        'top_pages': [{'path': row.path, 'views': row.views} for row in top_pages],
    }


@router.get('/me', response_model=CurrentStaff)
async def me(db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(get_current_staff)):
    profile = await db.scalar(select(Profile).where(Profile.id == staff.id))
    return CurrentStaff(
        id=staff.id,
        email=profile.email if profile else staff.email,
        full_name=profile.full_name if profile else staff.full_name,
        phone=profile.phone if profile else None,
        job_title=profile.job_title if profile else None,
        department=profile.department if profile else None,
        preferred_contact_method=profile.preferred_contact_method if profile else None,
        avatar_url=profile.avatar_url if profile else None,
        notification_preferences=normalize_notification_preferences(profile.notification_preferences if profile else {}, staff.roles),
        roles=sorted(staff.roles),
    )


@router.patch('/me', response_model=CurrentStaff)
async def update_me(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(get_current_staff),
):
    profile = await db.scalar(select(Profile).where(Profile.id == staff.id))
    if not profile:
        raise AppError('staff_not_found', 'Staff account not found.', 404)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if 'phone' in payload.model_fields_set:
        profile.phone = payload.phone
    if 'job_title' in payload.model_fields_set:
        profile.job_title = payload.job_title
    if 'department' in payload.model_fields_set:
        profile.department = payload.department
    if 'preferred_contact_method' in payload.model_fields_set:
        profile.preferred_contact_method = payload.preferred_contact_method
    if 'avatar_url' in payload.model_fields_set:
        profile.avatar_url = payload.avatar_url
    if payload.notification_preferences is not None:
        notification_preferences = normalize_notification_preferences(payload.notification_preferences, staff.roles)
        profile.notification_preferences = notification_preferences

    await write_audit(db, staff.id, 'profile.update', 'profile', staff.id, {'self_service': True})
    await db.commit()
    await db.refresh(profile)
    return CurrentStaff(
        id=staff.id,
        email=profile.email,
        full_name=profile.full_name,
        phone=profile.phone,
        job_title=profile.job_title,
        department=profile.department,
        preferred_contact_method=profile.preferred_contact_method,
        avatar_url=profile.avatar_url,
        notification_preferences=normalize_notification_preferences(profile.notification_preferences, staff.roles),
        roles=sorted(staff.roles),
    )


@router.get('/notifications', response_model=AdminNotificationList)
async def admin_notifications(
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(get_current_staff),
):
    items, unread_count = await list_user_notifications(db, staff.id)
    return {'items': items, 'unread_count': unread_count}


@router.patch('/notifications/{notification_id}/read', status_code=204)
async def admin_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(get_current_staff),
):
    await mark_notification_read(db, staff.id, notification_id)
    return Response(status_code=204)


@router.patch('/notifications/read-all', status_code=204)
async def admin_notifications_read_all(
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(get_current_staff),
):
    await mark_all_notifications_read(db, staff.id)
    return Response(status_code=204)


@router.get('/overview')
async def admin_overview(
    db: AsyncSession = Depends(get_db),
    staff: StaffPrincipal = Depends(get_current_staff),
):
    news_items = []
    news_total = None
    if staff.roles.intersection({'admin', 'editor', 'content_manager'}):
        rows = (await db.execute(
            select(
                NewsArticle.id,
                NewsArticle.title,
                NewsArticle.status,
                NewsArticle.updated_at,
                func.count().over().label('total'),
            )
            .where(NewsArticle.deleted_at.is_(None))
            .order_by(NewsArticle.updated_at.desc())
            .limit(5)
        )).all()
        news_total = int(rows[0].total) if rows else 0
        news_items = [
            {'id': row.id, 'title': row.title, 'status': row.status, 'updated_at': row.updated_at}
            for row in rows
        ]

    lead_items = []
    lead_total = None
    if staff.roles.intersection({'admin', 'sales'}):
        rows = (await db.execute(
            select(
                Lead.id,
                Lead.reference_no,
                Lead.first_name,
                Lead.last_name,
                Lead.status,
                Lead.created_at,
                func.count().over().label('total'),
            )
            .where(Lead.deleted_at.is_(None))
            .order_by(Lead.created_at.desc())
            .limit(5)
        )).all()
        lead_total = int(rows[0].total) if rows else 0
        lead_items = [
            {
                'id': row.id,
                'reference_no': row.reference_no,
                'first_name': row.first_name,
                'last_name': row.last_name,
                'status': row.status,
                'created_at': row.created_at,
            }
            for row in rows
        ]

    return {
        'news': {'items': news_items, 'total': news_total},
        'leads': {'items': lead_items, 'total': lead_total},
        'analytics': await _analytics_summary(db, 30),
    }


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
    await write_audit(db, staff.id, 'staff.create', 'profile', result['id'], {
        'email': result['email'],
        'roles': result['roles'],
        'notification_key': 'staff_changes',
        'notification_events': ['staff_account_created', 'staff_permissions_changed'],
    })
    await create_preference_notifications(
        db,
        preference_key='staff_account_changes',
        notification_type='staff_account_created',
        title='Staff account created',
        message=f"{result['full_name']} was added to Team Access.",
        link='/admin/staff',
        allowed_roles={'admin'},
    )
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
    notification_events = []
    if payload.status == 'active':
        notification_events.append('staff_account_activated')
    if payload.status == 'suspended':
        notification_events.append('staff_account_suspended')
    if payload.roles is not None:
        notification_events.extend(['staff_role_changed', 'staff_permissions_changed'])
    if payload.password:
        notification_events.append('staff_access_changed')
    await write_audit(db, staff.id, 'staff.update', 'profile', user_id, {
        'status': result['status'],
        'roles': result['roles'],
        'notification_key': 'staff_changes',
        'notification_events': notification_events,
    })
    if notification_events:
        action_text = 'access was updated'
        if payload.status == 'active':
            action_text = 'account was activated'
        if payload.status == 'suspended':
            action_text = 'account was suspended'
        if payload.roles is not None:
            action_text = 'roles or access were updated'
        await create_preference_notifications(
            db,
            preference_key='staff_account_changes',
            notification_type='staff_account_changed',
            title='Staff account changes',
            message=f"{result['full_name']}'s {action_text}.",
            link='/admin/staff',
            allowed_roles={'admin'},
        )
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
    before = await get_article(db, article_id)
    was_published = before.status == 'published'
    article = await update_article(db, article_id, payload, staff.id)
    if was_published:
        await create_preference_notifications(
            db,
            preference_key='newsroom_publication_activity',
            notification_type='newsroom_article_updated',
            title='Published newsroom article updated',
            message=f'"{article.title}" was updated.',
            link=f'/admin/news',
            allowed_roles={'admin', 'editor', 'content_manager'},
        )
        await db.commit()
    return article


@router.post('/news/{article_id}/publish', response_model=NewsArticleOut)
async def admin_publish_news(article_id: UUID, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','editor'))):
    article = await publish_article(db, article_id, staff.id)
    await create_preference_notifications(
        db,
        preference_key='newsroom_publication_activity',
        notification_type='newsroom_article_published',
        title='Newsroom update published',
        message=f'"{article.title}" was published.',
        link='/admin/news',
        allowed_roles={'admin', 'editor', 'content_manager'},
    )
    await db.commit()
    return article


@router.post('/news/{article_id}/unpublish', response_model=NewsArticleOut)
async def admin_unpublish_news(article_id: UUID, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin','editor'))):
    article = await unpublish_article(db, article_id, staff.id)
    await create_preference_notifications(
        db,
        preference_key='newsroom_publication_activity',
        notification_type='newsroom_article_unpublished',
        title='Newsroom update unpublished',
        message=f'"{article.title}" was unpublished.',
        link='/admin/news',
        allowed_roles={'admin', 'editor', 'content_manager'},
    )
    await db.commit()
    return article


@router.delete('/news/{article_id}', status_code=204)
async def admin_archive_news(article_id: UUID, db: AsyncSession = Depends(get_db), staff: StaffPrincipal = Depends(require_roles('admin'))):
    article = await get_article(db, article_id)
    await archive_article(db, article_id, staff.id)
    await create_preference_notifications(
        db,
        preference_key='newsroom_publication_activity',
        notification_type='newsroom_article_archived',
        title='Newsroom update archived',
        message=f'"{article.title}" was archived.',
        link='/admin/news',
        allowed_roles={'admin', 'editor', 'content_manager'},
    )
    await db.commit()
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
    if payload.status is not None and payload.status != before['status']:
        actor_name = staff.full_name or staff.email or 'A staff member'
        await create_preference_notifications(
            db,
            preference_key='lead_status_updates',
            notification_type='lead_status_changed',
            title='Lead status updated',
            message=f"{lead.reference_no} changed from {before['status']} to {lead.status} by {actor_name}.",
            link='/admin/leads',
            allowed_roles={'admin', 'sales'},
        )
    await db.commit()
    return await db.scalar(select(Lead).options(selectinload(Lead.notes)).where(Lead.id == lead.id))


@router.post('/uploads/newsroom-image')
async def upload_newsroom_image(
    request: Request,
    file: UploadFile = File(...),
    _: StaffPrincipal = Depends(require_roles('admin','editor','content_manager')),
):
    public_path = await save_local_newsroom_image(file)
    # Store a stable relative media path rather than a localhost/backend URL.
    # The frontend proxies /media to the configured backend, so the same DB
    # value works locally and after deployment.
    return {'url': public_path, 'path': public_path}


@router.post('/uploads/profile-image')
async def upload_profile_image(
    request: Request,
    file: UploadFile = File(...),
    staff: StaffPrincipal = Depends(get_current_staff),
):
    public_path = await save_local_profile_image(file, staff.id)
    base = str(request.base_url).rstrip('/')
    return {'url': f'{base}{public_path}', 'path': public_path}


@router.post('/uploads/sign', response_model=UploadSignResponse)
async def sign_upload(payload: UploadSignRequest, staff: StaffPrincipal = Depends(require_roles('admin','editor'))):
    data = create_signed_upload(payload.filename, payload.content_type, payload.size_bytes, payload.folder)
    return UploadSignResponse(**data)


@router.get('/analytics')
async def admin_analytics(
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    _: StaffPrincipal = Depends(require_roles('admin','sales','editor','content_manager')),
):
    return await _analytics_summary(db, days)


async def _lead_export_rows(db: AsyncSession):
    return (await db.scalars(
        select(Lead).where(Lead.deleted_at.is_(None)).order_by(Lead.created_at.desc())
    )).all()


@router.get('/exports/leads.csv')
async def export_leads_csv(
    db: AsyncSession = Depends(get_db),
    _: StaffPrincipal = Depends(require_roles('admin','sales')),
):
    leads = await _lead_export_rows(db)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Reference','Name','Email','Phone','Country','Enquiry type','Preferred contact','Status','Created'])
    for lead in leads:
        writer.writerow([
            lead.reference_no,
            f'{lead.first_name} {lead.last_name}'.strip(),
            lead.email,
            lead.phone or '',
            lead.country or '',
            lead.enquiry_type or '',
            lead.preferred_contact_method or '',
            lead.status,
            lead.created_at.isoformat() if lead.created_at else '',
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="oniria-enquiries.csv"'},
    )


@router.get('/exports/leads.xlsx')
async def export_leads_xlsx(
    db: AsyncSession = Depends(get_db),
    _: StaffPrincipal = Depends(require_roles('admin','sales')),
):
    from openpyxl import Workbook
    from openpyxl.styles import Font

    leads = await _lead_export_rows(db)
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = 'Enquiries'
    headers = ['Reference','Name','Email','Phone','Country','Enquiry type','Preferred contact','Status','Created']
    sheet.append(headers)
    for cell in sheet[1]:
        cell.font = Font(bold=True)
    for lead in leads:
        sheet.append([
            lead.reference_no,
            f'{lead.first_name} {lead.last_name}'.strip(),
            lead.email,
            lead.phone or '',
            lead.country or '',
            lead.enquiry_type or '',
            lead.preferred_contact_method or '',
            lead.status,
            lead.created_at.isoformat() if lead.created_at else '',
        ])
    for column_cells in sheet.columns:
        width = min(max(len(str(cell.value or '')) for cell in column_cells) + 2, 42)
        sheet.column_dimensions[column_cells[0].column_letter].width = width
    stream = BytesIO()
    workbook.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename="oniria-enquiries.xlsx"'},
    )


@router.get('/exports/news.csv')
async def export_news_csv(
    db: AsyncSession = Depends(get_db),
    _: StaffPrincipal = Depends(require_roles('admin','editor','content_manager')),
):
    articles = (await db.scalars(
        select(NewsArticle).where(NewsArticle.deleted_at.is_(None)).order_by(NewsArticle.updated_at.desc())
    )).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Title','Slug','Status','Published','Updated'])
    for article in articles:
        writer.writerow([
            article.title,
            article.slug,
            article.status,
            article.published_at.isoformat() if article.published_at else '',
            article.updated_at.isoformat() if article.updated_at else '',
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="oniria-newsroom.csv"'},
    )


@router.get('/exports/activity.csv')
async def export_activity_csv(
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    _: StaffPrincipal = Depends(require_roles('admin','sales','editor','content_manager')),
):
    start = datetime.now(timezone.utc) - timedelta(days=days - 1)
    rows = (await db.execute(
        select(
            cast(SiteVisit.created_at, Date).label('day'),
            SiteVisit.path,
            func.count(SiteVisit.id).label('views'),
            func.count(func.distinct(SiteVisit.session_id)).label('visitors'),
        )
        .where(SiteVisit.created_at >= start)
        .group_by(cast(SiteVisit.created_at, Date), SiteVisit.path)
        .order_by(cast(SiteVisit.created_at, Date).desc(), func.count(SiteVisit.id).desc())
    )).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date','Page','Views','Visitors'])
    for row in rows:
        writer.writerow([row.day.isoformat(), row.path, row.views, row.visitors])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="oniria-website-activity.csv"'},
    )
