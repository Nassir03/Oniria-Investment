from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entities import BusinessArea, SiteSetting

router = APIRouter(tags=['public'])


@router.get('/business-areas')
async def business_areas(db: AsyncSession = Depends(get_db)):
    items = (await db.scalars(select(BusinessArea).order_by(BusinessArea.sort_order, BusinessArea.name))).all()
    return [{'id': str(x.id), 'slug': x.slug, 'name': x.name, 'summary': x.summary, 'body': x.body} for x in items]


@router.get('/site-settings')
async def site_settings(db: AsyncSession = Depends(get_db)):
    rows = (await db.scalars(select(SiteSetting))).all()
    return {row.key: row.value_json for row in rows}
