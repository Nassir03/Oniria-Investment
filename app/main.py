import sentry_sdk
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import AppError, app_error_handler, http_error_handler, validation_error_handler
from app.db.session import engine
from app.middleware.request_id import RequestIDMiddleware

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment, traces_sample_rate=0.1)

app = FastAPI(title=settings.app_name, version='1.0.0', debug=settings.debug)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(StarletteHTTPException, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get('/health', tags=['health'])
async def health():
    async with engine.connect() as conn:
        await conn.execute(text('SELECT 1'))
    return {'status': 'ok', 'database': 'ok', 'environment': settings.environment}
