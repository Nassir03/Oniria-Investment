from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.entities import Profile, StaffRoleAssignment

bearer = HTTPBearer(auto_error=False)


@dataclass
class StaffPrincipal:
    id: UUID
    email: str | None
    full_name: str | None
    roles: set[str]


@lru_cache
def jwks_client() -> PyJWKClient:
    if not settings.supabase_jwks_url:
        raise AppError('auth_not_configured', 'Supabase authentication is not configured.', 503)
    return PyJWKClient(settings.supabase_jwks_url, cache_keys=True)


def decode_supabase_jwt(token: str) -> dict:
    if not settings.supabase_jwt_issuer or not settings.supabase_jwks_url:
        raise AppError('auth_not_configured', 'Supabase authentication is not configured.', 503)
    try:
        signing_key = jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=['RS256', 'ES256'],
            audience='authenticated',
            issuer=settings.supabase_jwt_issuer,
            options={'require': ['exp', 'sub']},
        )
    except jwt.PyJWTError as exc:
        raise AppError('invalid_token', 'Authentication token is invalid or expired.', 401) from exc


async def get_current_staff(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> StaffPrincipal:
    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise AppError('authentication_required', 'Authentication is required.', 401)

    claims = decode_supabase_jwt(credentials.credentials)
    try:
        user_id = UUID(claims['sub'])
    except Exception as exc:
        raise AppError('invalid_token', 'Authentication token subject is invalid.', 401) from exc

    profile = await db.scalar(select(Profile).where(Profile.id == user_id))
    if not profile or profile.status != 'active':
        raise AppError('staff_not_active', 'This staff account is not active.', 403)

    roles = set((await db.scalars(select(StaffRoleAssignment.role).where(StaffRoleAssignment.user_id == user_id))).all())
    if not roles:
        raise AppError('staff_role_required', 'This account has no staff permissions.', 403)

    return StaffPrincipal(id=user_id, email=profile.email or claims.get('email'), full_name=profile.full_name, roles=roles)


def require_roles(*allowed: str):
    async def dependency(staff: StaffPrincipal = Depends(get_current_staff)) -> StaffPrincipal:
        if not staff.roles.intersection(allowed):
            raise AppError('forbidden', 'You do not have permission to perform this action.', 403)
        return staff
    return dependency
