from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AdminNotification, Profile, ProfileStatus, StaffRoleAssignment

NOTIFICATION_KEYS = {
    'new_customer_enquiry',
    'lead_status_updates',
    'newsroom_publication_activity',
    'staff_account_changes',
    'weekly_administration_summary',
}

LEGACY_KEYS = {
    'new_enquiry': 'new_customer_enquiry',
    'lead_status': 'lead_status_updates',
    'newsroom_activity': 'newsroom_publication_activity',
    'staff_changes': 'staff_account_changes',
    'weekly_summary': 'weekly_administration_summary',
    'email': 'delivery_email',
    'in_app': 'delivery_in_app',
}


def default_notification_preferences(roles: set[str] | list[str]) -> dict:
    role_set = set(roles)
    return {
        'new_customer_enquiry': bool(role_set.intersection({'admin', 'sales'})),
        'lead_status_updates': bool(role_set.intersection({'admin', 'sales'})),
        'newsroom_publication_activity': bool(role_set.intersection({'admin', 'editor', 'content_manager'})),
        'staff_account_changes': 'admin' in role_set,
        'weekly_administration_summary': False,
        'delivery_email': False,
        'delivery_in_app': True,
    }


def normalize_notification_preferences(raw: dict | None, roles: set[str] | list[str]) -> dict:
    prefs = default_notification_preferences(roles)
    source = raw or {}
    for key, value in source.items():
        if key == 'delivery' and isinstance(value, dict):
            for delivery_key, delivery_value in value.items():
                mapped = LEGACY_KEYS.get(delivery_key)
                if mapped:
                    prefs[mapped] = bool(delivery_value)
            continue
        mapped_key = LEGACY_KEYS.get(key, key)
        if mapped_key in prefs:
            prefs[mapped_key] = bool(value)
    prefs['delivery_email'] = False
    if 'admin' not in set(roles):
        prefs['staff_account_changes'] = False
    return prefs


async def roles_for_user(db: AsyncSession, user_id: UUID) -> set[str]:
    roles = (await db.scalars(select(StaffRoleAssignment.role).where(StaffRoleAssignment.user_id == user_id))).all()
    return set(roles)


async def create_preference_notifications(
    db: AsyncSession,
    *,
    preference_key: str,
    notification_type: str,
    title: str,
    message: str,
    link: str,
    allowed_roles: set[str] | None = None,
) -> int:
    if preference_key not in NOTIFICATION_KEYS:
        return 0
    profiles = (await db.scalars(select(Profile).where(Profile.status == ProfileStatus.active.value))).all()
    if not profiles:
        return 0
    user_ids = [profile.id for profile in profiles]
    role_rows = (await db.execute(
        select(StaffRoleAssignment.user_id, StaffRoleAssignment.role).where(StaffRoleAssignment.user_id.in_(user_ids))
    )).all()
    role_map: dict[UUID, set[str]] = {profile.id: set() for profile in profiles}
    for user_id, role in role_rows:
        role_map.setdefault(user_id, set()).add(role)

    created = 0
    for profile in profiles:
        roles = role_map.get(profile.id, set())
        if allowed_roles and not roles.intersection(allowed_roles):
            continue
        prefs = normalize_notification_preferences(profile.notification_preferences, roles)
        if not prefs.get(preference_key) or not prefs.get('delivery_in_app'):
            continue
        db.add(AdminNotification(
            user_id=profile.id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
        ))
        created += 1
    return created


async def list_user_notifications(db: AsyncSession, user_id: UUID, limit: int = 12) -> tuple[list[AdminNotification], int]:
    items = (await db.scalars(
        select(AdminNotification)
        .where(AdminNotification.user_id == user_id)
        .order_by(AdminNotification.created_at.desc())
        .limit(limit)
    )).all()
    unread = await db.scalar(
        select(func.count()).select_from(AdminNotification).where(
            AdminNotification.user_id == user_id,
            AdminNotification.is_read.is_(False),
        )
    ) or 0
    return list(items), int(unread)


async def mark_notification_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> None:
    notification = await db.scalar(
        select(AdminNotification).where(AdminNotification.id == notification_id, AdminNotification.user_id == user_id)
    )
    if notification:
        notification.is_read = True
        await db.commit()


async def mark_all_notifications_read(db: AsyncSession, user_id: UUID) -> None:
    rows = (await db.scalars(
        select(AdminNotification).where(AdminNotification.user_id == user_id, AdminNotification.is_read.is_(False))
    )).all()
    for notification in rows:
        notification.is_read = True
    await db.commit()


async def clear_old_read_notifications(db: AsyncSession, user_id: UUID, keep: int = 100) -> None:
    old_ids = (await db.scalars(
        select(AdminNotification.id)
        .where(AdminNotification.user_id == user_id, AdminNotification.is_read.is_(True))
        .order_by(AdminNotification.created_at.desc())
        .offset(keep)
    )).all()
    if old_ids:
        await db.execute(delete(AdminNotification).where(AdminNotification.id.in_(old_ids)))
        await db.commit()
