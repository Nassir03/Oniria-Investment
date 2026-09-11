from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.entities import AuditLog


async def write_audit(db: AsyncSession, actor_id: UUID | None, action: str, entity_type: str, entity_id: UUID | None, metadata: dict | None = None):
    db.add(AuditLog(actor_id=actor_id, action=action, entity_type=entity_type, entity_id=entity_id, metadata_json=metadata or {}))
