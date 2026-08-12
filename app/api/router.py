from fastapi import APIRouter
from app.api.routes import admin, leads, news, projects, public

api_router = APIRouter()
api_router.include_router(public.router)
api_router.include_router(projects.router)
api_router.include_router(news.router)
api_router.include_router(leads.router)
api_router.include_router(admin.router)
