from functools import lru_cache
from typing import Annotated, List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=('.env', '../.env'),
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

    # PostgreSQL connection.
    # Supabase/Vercel may provide postgresql://
    # and this file converts it automatically to
    # postgresql+asyncpg:// for SQLAlchemy async use.
    database_url: str

    # Supabase
    supabase_url: str | None = None
    supabase_jwt_issuer: str | None = None
    supabase_jwks_url: str | None = None
    supabase_secret_key: str | None = None

    # Backward compatibility with older .env files.
    supabase_service_role_key: str | None = None

    storage_bucket: str = 'oniria-media'

    # Email / monitoring
    resend_api_key: str | None = None
    contact_notification_email: str | None = None
    email_from: str = 'ONIRIA Investments <no-reply@example.com>'
    sentry_dsn: str | None = None

    # Limits
    lead_rate_limit_per_minute: int = 10
    max_upload_bytes: int = 100 * 1024 * 1024

    allowed_upload_mime_types: Annotated[List[str], NoDecode] = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'application/pdf',
        'video/mp4',
        'video/webm',
    ]

    @field_validator(
        'frontend_origins',
        'allowed_upload_mime_types',
        mode='before',
    )
    @classmethod
    def split_csv(cls, value):
        if isinstance(value, str):
            return [
                x.strip()
                for x in value.split(',')
                if x.strip()
            ]

        return value

    @field_validator('debug', mode='before')
    @classmethod
    def parse_debug_label(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()

            if normalized in {
                'release',
                'production',
                'prod',
            }:
                return False

            if normalized in {
                'development',
                'dev',
                'local',
            }:
                return True

        return value

    @field_validator('database_url', mode='before')
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError('DATABASE_URL is required')

        value = value.strip()

        if value.startswith('postgres://'):
            value = (
                'postgresql+asyncpg://'
                + value[len('postgres://'):]
            )

        elif value.startswith('postgresql://'):
            value = (
                'postgresql+asyncpg://'
                + value[len('postgresql://'):]
            )

        if not value.startswith(
            'postgresql+asyncpg://'
        ):
            raise ValueError(
                'DATABASE_URL must use PostgreSQL with asyncpg'
            )

        return value

    @field_validator(
        'supabase_url',
        'supabase_jwt_issuer',
        'supabase_jwks_url',
        'supabase_secret_key',
        'supabase_service_role_key',
        'resend_api_key',
        'contact_notification_email',
        'sentry_dsn',
        mode='before',
    )
    @classmethod
    def blank_to_none(cls, value):
        if isinstance(value, str):
            value = value.strip()

        return value or None

    @model_validator(mode='after')
    def use_legacy_supabase_service_role_key(self):
        if (
            self.supabase_secret_key is None
            and self.supabase_service_role_key is not None
        ):
            self.supabase_secret_key = (
                self.supabase_service_role_key
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
