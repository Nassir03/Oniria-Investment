import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import Lead, Project
from app.schemas.lead import LeadCreate, LeadCreated
from app.services.email_service import send_lead_notifications
from app.services.rate_limit import lead_limiter

router = APIRouter(prefix='/leads', tags=['leads'])


def make_reference() -> str:
    return f"ON-{datetime.now(timezone.utc):%Y%m%d}-{secrets.randbelow(100000):05d}"


@router.post('', response_model=LeadCreated, status_code=201)
async def create_lead(payload: LeadCreate, request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else 'unknown'
    await lead_limiter.check(ip)
    if payload.honeypot:
        raise AppError('spam_detected', 'Submission rejected.', 400)
    if payload.project_id and not await db.scalar(select(Project.id).where(Project.id == payload.project_id, Project.status == 'published')):
        raise AppError('invalid_project', 'Selected project does not exist.', 400)

    reference = make_reference()
    while await db.scalar(select(Lead.id).where(Lead.reference_no == reference)):
        reference = make_reference()

    lead = Lead(
        reference_no=reference, source='website', project_id=payload.project_id,
        first_name=payload.first_name.strip(), last_name=payload.last_name.strip(), email=str(payload.email).lower(),
        phone=payload.phone, country=payload.country, enquiry_type=payload.enquiry_type,
        preferred_contact_method=payload.preferred_contact_method, message=payload.message.strip(), consent=payload.consent,
        status='new',
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    background_tasks.add_task(send_lead_notifications, lead.reference_no, lead.first_name, lead.email, lead.message)
    return LeadCreated(id=lead.id, reference_no=lead.reference_no)
