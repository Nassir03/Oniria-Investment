import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.entities import BusinessArea, Project, ProjectMedia, SiteSetting

PROJECTS = [
    {
        'slug': 'oniria-stone-town',
        'name': 'ONIRIA Stone Town',
        'category': 'Hospitality',
        'location': 'Location details available on enquiry',
        'summary': 'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet.',
        'featured': False,
        'media': [('/images/stone-town-restaurant.jpg','ONIRIA Stone Town restaurant concept visualization'),('/images/restaurant.webp','ONIRIA hospitality lounge concept visualization')],
    },
    {
        'slug': 'oniria-michamvi',
        'name': 'ONIRIA Michamvi',
        'category': 'Destination Development',
        'location': 'Location details available on enquiry',
        'summary': 'A coastal destination concept focused on landscape, hospitality and an immersive sense of escape.',
        'featured': False,
        'media': [('/images/michamvi-concept.jpg','ONIRIA Michamvi coastal concept visualization'),('/images/homepage-light.webp','ONIRIA coastal residence concept visualization')],
    },
    {
        'slug': 'ona-towers',
        'name': 'ONA Towers',
        'category': 'Residential',
        'location': 'Location details available on enquiry',
        'summary': 'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
        'featured': True,
        'media': [('/images/outside-ona-tower.jpg','ONA Towers arrival concept visualization'),('/images/ona-tower.webp','ONA Towers exterior concept visualization'),('/images/room.webp','ONA Towers bedroom concept visualization')],
    },
    {
        'slug': 'v-town',
        'name': 'V Town',
        'category': 'Mixed-use',
        'location': 'Location details available on enquiry',
        'summary': 'A new ONIRIA residential expression composed around calm architecture, greenery and everyday quality of life.',
        'featured': False,
        'media': [('/images/v-town-villa.webp','V Town villa concept visualization'),('/images/room.webp','ONIRIA residential interior concept visualization')],
    },
]

BUSINESS_AREAS = [
    ('destination-development', 'Destination Development', 'Destination concepts that align architecture, landscape and experience around a clear sense of place.'),
    ('hospitality', 'Hospitality', 'Guest experiences considered from arrival and dining through private rooms and shared spaces.'),
    ('residential', 'Residential', 'Homes designed around comfort, light, materiality and an understated sense of premium living.'),
    ('mixed-use', 'Mixed-use', 'Integrated environments where complementary uses contribute to a coherent destination experience.'),
]

async def main():
    async with SessionLocal() as db:
        for i, data in enumerate(PROJECTS):
            project = await db.scalar(select(Project).where(Project.slug == data['slug']))
            if not project:
                project = Project(slug=data['slug'], name=data['name'], status='published', sort_order=i)
                db.add(project)
                await db.flush()
            project.name = data['name']
            project.category = data['category']
            project.location = data['location']
            project.summary = data['summary']
            project.body = {'presentation_note': 'Concept imagery is presented as visualization and should not be treated as a completed-development photograph.'}
            project.status = 'published'
            project.featured = data['featured']
            project.sort_order = i
            existing_urls = set((await db.scalars(select(ProjectMedia.url).where(ProjectMedia.project_id == project.id))).all())
            for order, (url, alt) in enumerate(data['media']):
                if url not in existing_urls:
                    db.add(ProjectMedia(project_id=project.id,url=url,alt_text=alt,media_type='image',is_concept=True,sort_order=order))

        for i, (slug, name, summary) in enumerate(BUSINESS_AREAS):
            area = await db.scalar(select(BusinessArea).where(BusinessArea.slug == slug))
            if not area:
                area = BusinessArea(slug=slug, name=name)
                db.add(area)
            area.name = name
            area.summary = summary
            area.sort_order = i

        brand = await db.get(SiteSetting, 'brand')
        if not brand:
            brand = SiteSetting(key='brand', value_json={})
            db.add(brand)
        brand.value_json = {'page_color':'#B8A37C','footer_color':'#031B35','editorial_surface':'#F7F3EA'}
        await db.commit()

if __name__ == '__main__':
    asyncio.run(main())
