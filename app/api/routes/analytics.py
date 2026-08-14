from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import SiteVisit
from app.schemas.analytics import PageViewCreate

router = APIRouter(prefix='/analytics', tags=['analytics'])


@router.post('/page-view', status_code=204)
async def record_page_view(
    payload: PageViewCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if payload.path.startswith('/admin'):
        return Response(status_code=204)

    db.add(
        SiteVisit(
            path=payload.path,
            session_id=payload.session_id,
            referrer=payload.referrer,
            user_agent=(request.headers.get('user-agent') or '')[:500] or None,
        )
    )
    await db.commit()
    return Response(status_code=204)
