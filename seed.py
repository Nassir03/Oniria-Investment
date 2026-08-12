import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.entities import BusinessArea, Project, SiteSetting

PROJECTS = [
    ('oniria-stone-town', 'ONIRIA Stone Town'),
    ('oniria-michamvi', 'ONIRIA Michamvi'),
    ('ona-towers', 'ONA Towers'),
    ('v-town', 'V Town'),
]

async def main():
    async with SessionLocal() as db:
        for i, (slug, name) in enumerate(PROJECTS):
            if not await db.scalar(select(Project.id).where(Project.slug == slug)):
                db.add(Project(slug=slug, name=name, status='published', sort_order=i))
        for i, name in enumerate(['Destination Development','Hospitality','Residential','Mixed-use']):
            slug = name.lower().replace(' ', '-').replace('/','-')
            if not await db.scalar(select(BusinessArea.id).where(BusinessArea.slug == slug)):
                db.add(BusinessArea(slug=slug, name=name, sort_order=i))
        if not await db.get(SiteSetting, 'brand'):
            db.add(SiteSetting(key='brand', value_json={'page_color':'#B8A37C','footer_color':'#031B35'}))
        await db.commit()

if __name__ == '__main__':
    asyncio.run(main())
