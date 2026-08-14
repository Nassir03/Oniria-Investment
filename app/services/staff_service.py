from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.core.config import settings
from app.core.errors import AppError
from app.models.entities import Profile, StaffRoleAssignment

ALLOWED_STAFF_ROLES = {'admin', 'editor', 'content_manager', 'sales'}


def _admin_auth():
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise AppError(
            'staff_management_not_configured',
            'Supabase server credentials are required for staff management.',
            503,
        )
    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return client.auth.admin


def validate_roles(roles: list[str]) -> list[str]:
    normalized = sorted(set(role.strip().lower() for role in roles if role and role.strip()))
    if not normalized:
        raise AppError('staff_role_required', 'Choose at least one staff role.', 400)
    invalid = [role for role in normalized if role not in ALLOWED_STAFF_ROLES]
    if invalid:
        raise AppError('invalid_staff_role', f"Unsupported staff role: {', '.join(invalid)}", 400)
    return normalized


async def list_staff(db: AsyncSession) -> list[dict]:
    profiles = (await db.scalars(select(Profile).order_by(Profile.created_at.desc()))).all()
    if not profiles:
        return []
    ids = [profile.id for profile in profiles]
    role_rows = (await db.execute(
        select(StaffRoleAssignment.user_id, StaffRoleAssignment.role).where(StaffRoleAssignment.user_id.in_(ids))
    )).all()
    role_map: dict[UUID, list[str]] = {profile.id: [] for profile in profiles}
    for user_id, role in role_rows:
        role_map.setdefault(user_id, []).append(role)
    return [
        {
            'id': profile.id,
            'email': profile.email,
            'full_name': profile.full_name,
            'status': profile.status,
            'roles': sorted(role_map.get(profile.id, [])),
            'created_at': profile.created_at,
            'updated_at': profile.updated_at,
        }
        for profile in profiles
    ]


async def create_staff(
    db: AsyncSession,
    *,
    email: str,
    full_name: str,
    password: str,
    roles: list[str],
    granted_by: UUID,
) -> dict:
    roles = validate_roles(roles)
    if await db.scalar(select(Profile.id).where(Profile.email == email)):
        raise AppError('staff_email_exists', 'A staff profile already uses this email address.', 409)

    admin_auth = _admin_auth()
    auth_user_id: UUID | None = None
    try:
        response = admin_auth.create_user(
            {
                'email': email,
                'password': password,
                'email_confirm': True,
                'user_metadata': {'full_name': full_name},
            }
        )
        user = getattr(response, 'user', None)
        if user is None or not getattr(user, 'id', None):
            raise AppError('staff_auth_create_failed', 'Supabase did not return the created staff user.', 502)
        auth_user_id = UUID(str(user.id))

        profile = Profile(id=auth_user_id, full_name=full_name, email=email, status='active')
        db.add(profile)
        for role in roles:
            db.add(StaffRoleAssignment(user_id=auth_user_id, role=role, granted_by=granted_by))
        await db.commit()
        await db.refresh(profile)
        return {
            'id': profile.id,
            'email': profile.email,
            'full_name': profile.full_name,
            'status': profile.status,
            'roles': roles,
            'created_at': profile.created_at,
            'updated_at': profile.updated_at,
        }
    except AppError:
        await db.rollback()
        if auth_user_id:
            try:
                admin_auth.delete_user(str(auth_user_id))
            except Exception:
                pass
        raise
    except Exception as exc:
        await db.rollback()
        if auth_user_id:
            try:
                admin_auth.delete_user(str(auth_user_id))
            except Exception:
                pass
        message = str(exc)
        if 'already' in message.lower() and 'registered' in message.lower():
            raise AppError('staff_auth_exists', 'This email already exists in Supabase Auth.', 409) from exc
        raise AppError('staff_auth_create_failed', 'Unable to create the Supabase staff account.', 502) from exc


async def update_staff(
    db: AsyncSession,
    user_id: UUID,
    *,
    full_name: str | None,
    status: str | None,
    roles: list[str] | None,
    password: str | None,
    actor_id: UUID,
) -> dict:
    profile = await db.scalar(select(Profile).where(Profile.id == user_id))
    if not profile:
        raise AppError('staff_not_found', 'Staff account not found.', 404)

    if status is not None and status not in {'active', 'suspended'}:
        raise AppError('invalid_staff_status', 'Staff status must be active or suspended.', 400)

    if roles is not None:
        roles = validate_roles(roles)

    if user_id == actor_id and status == 'suspended':
        raise AppError('cannot_suspend_self', 'You cannot suspend your own staff account.', 400)
    if user_id == actor_id and roles is not None and 'admin' not in roles:
        raise AppError('cannot_remove_own_admin', 'You cannot remove your own admin role.', 400)

    if full_name is not None:
        profile.full_name = full_name
    if status is not None:
        profile.status = status

    if roles is not None:
        await db.execute(delete(StaffRoleAssignment).where(StaffRoleAssignment.user_id == user_id))
        for role in roles:
            db.add(StaffRoleAssignment(user_id=user_id, role=role, granted_by=actor_id))

    if password:
        try:
            _admin_auth().update_user_by_id(str(user_id), {'password': password})
        except Exception as exc:
            await db.rollback()
            raise AppError('staff_password_update_failed', 'Unable to update the staff password in Supabase.', 502) from exc

    await db.commit()
    await db.refresh(profile)
    current_roles = (await db.scalars(
        select(StaffRoleAssignment.role).where(StaffRoleAssignment.user_id == user_id)
    )).all()
    return {
        'id': profile.id,
        'email': profile.email,
        'full_name': profile.full_name,
        'status': profile.status,
        'roles': sorted(current_roles),
        'created_at': profile.created_at,
        'updated_at': profile.updated_at,
    }
