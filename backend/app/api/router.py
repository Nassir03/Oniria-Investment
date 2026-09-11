from fastapi import APIRouter
from app.api.routes import admin, analytics, leads, news, projects, public, toolkit

api_router = APIRouter()
api_router.include_router(public.router)
api_router.include_router(analytics.router)
api_router.include_router(projects.router)
api_router.include_router(toolkit.router)
api_router.include_router(news.router)
api_router.include_router(leads.router)
api_router.include_router(admin.router)
