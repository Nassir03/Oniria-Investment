from functools import lru_cache
from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    app_name: str = 'ONIRIA Investments API'
    environment: str = 'local'
    debug: bool = False
    api_v1_prefix: str = '/api/v1'
    frontend_origins: Annotated[List[str], NoDecode] = [
        'http://localhost:3200',
        'http://127.0.0.1:3200',
    ]

    # SQLAlchemy async URL. For local Windows development use:
    # postgresql+asyncpg://postgres:<URL_ENCODED_PASSWORD>@127.0.0.1:3310/oniria
    database_url: str

    # Supabase is optional for public local development. It becomes required
    # for protected staff authentication and signed storage uploads.
    supabase_url: str | None = None
    supabase_jwt_issuer: str | None = None
    supabase_jwks_url: str | None = None
    supabase_service_role_key: str | None = None
    storage_bucket: str = 'oniria-media'

    resend_api_key: str | None = None
    contact_notification_email: str | None = None
    email_from: str = 'ONIRIA Investments <no-reply@example.com>'
    sentry_dsn: str | None = None

    lead_rate_limit_per_minute: int = 10
    max_upload_bytes: int = 10 * 1024 * 1024
    allowed_upload_mime_types: Annotated[List[str], NoDecode] = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
    ]

    @field_validator('frontend_origins', 'allowed_upload_mime_types', mode='before')
    @classmethod
    def split_csv(cls, value):
        if isinstance(value, str):
            return [x.strip() for x in value.split(',') if x.strip()]
        return value

    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith('postgresql+asyncpg://'):
            raise ValueError('DATABASE_URL must start with postgresql+asyncpg://')
        return value

    @field_validator(
        'supabase_url',
        'supabase_jwt_issuer',
        'supabase_jwks_url',
        'supabase_service_role_key',
        'resend_api_key',
        'contact_notification_email',
        'sentry_dsn',
        mode='before',
    )
    @classmethod
    def blank_to_none(cls, value):
        return None if value == '' else value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
