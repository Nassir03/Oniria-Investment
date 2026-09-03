import re
import secrets
from pathlib import Path, PurePosixPath
from uuid import UUID

from fastapi import UploadFile
from supabase import create_client

from app.core.config import settings
from app.core.errors import AppError


PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOCAL_MEDIA_ROOT = PROJECT_ROOT / 'uploads'


def _safe_filename(name: str) -> str:
    name = PurePosixPath(name).name
    name = re.sub(r'[^A-Za-z0-9._-]+', '-', name).strip('-')
    if not name or name.startswith('.'):
        raise AppError('invalid_filename', 'Invalid filename.', 400)
    return name


def create_signed_upload(filename: str, content_type: str, size_bytes: int, folder: str) -> dict:
    if content_type not in settings.allowed_upload_mime_types:
        raise AppError('unsupported_file_type', 'This file type is not allowed.', 400)
    if size_bytes <= 0 or size_bytes > settings.max_upload_bytes:
        raise AppError('invalid_file_size', f'Upload must be between 1 and {settings.max_upload_bytes} bytes.', 400)
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise AppError('storage_not_configured', 'Storage service is not configured.', 503)

    safe = _safe_filename(filename)
    folder = re.sub(r'[^A-Za-z0-9/_-]+', '-', folder).strip('/') or 'admin'
    path = f'{folder}/{secrets.token_hex(8)}-{safe}'

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    result = client.storage.from_(settings.storage_bucket).create_signed_upload_url(path)
    if not isinstance(result, dict):
        result = getattr(result, 'model_dump', lambda: {})()
    return {
        'path': path,
        'token': result.get('token') or result.get('signedURL', '').split('token=')[-1],
        'signed_url': result.get('signedURL') or result.get('signed_url'),
    }


async def save_local_newsroom_image(file: UploadFile) -> str:
    """Store an uploaded newsroom image locally and return its public /media path.

    This gives local Windows development a reliable upload workflow without
    depending on third-party share links. Production can later switch to the
    existing signed Supabase Storage workflow without changing article fields.
    """
    content_type = (file.content_type or '').lower()
    if content_type not in settings.allowed_upload_mime_types:
        raise AppError('unsupported_file_type', 'Use JPG, PNG, WEBP or AVIF images.', 400)

    raw = await file.read(settings.max_upload_bytes + 1)
    if not raw:
        raise AppError('empty_upload', 'The uploaded image is empty.', 400)
    if len(raw) > settings.max_upload_bytes:
        raise AppError('invalid_file_size', f'Image must be smaller than {settings.max_upload_bytes} bytes.', 400)

    safe = _safe_filename(file.filename or 'newsroom-image')
    extension = Path(safe).suffix.lower()
    if extension not in {'.jpg', '.jpeg', '.png', '.webp', '.avif'}:
        extension = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/avif': '.avif',
        }.get(content_type, '.jpg')

    target_dir = LOCAL_MEDIA_ROOT / 'newsroom'
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f'{secrets.token_hex(12)}{extension}'
    (target_dir / filename).write_bytes(raw)
    return f'/media/newsroom/{filename}'


async def save_local_profile_image(file: UploadFile, user_id: UUID) -> str:
    content_type = (file.content_type or '').lower()
    if content_type not in settings.allowed_upload_mime_types:
        raise AppError('unsupported_file_type', 'Use JPG, PNG, WEBP or AVIF images.', 400)

    raw = await file.read(settings.max_upload_bytes + 1)
    if not raw:
        raise AppError('empty_upload', 'The uploaded image is empty.', 400)
    if len(raw) > settings.max_upload_bytes:
        raise AppError('invalid_file_size', f'Image must be smaller than {settings.max_upload_bytes} bytes.', 400)

    safe = _safe_filename(file.filename or 'profile-image')
    extension = Path(safe).suffix.lower()
    if extension not in {'.jpg', '.jpeg', '.png', '.webp', '.avif'}:
        extension = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/avif': '.avif',
        }.get(content_type, '.jpg')

    target_dir = LOCAL_MEDIA_ROOT / 'staff'
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f'{user_id}-{secrets.token_hex(6)}{extension}'
    (target_dir / filename).write_bytes(raw)
    return f'/media/staff/{filename}'


def delete_storage_files(paths: list[str | None]) -> None:
    """Delete toolkit objects from the configured Supabase Storage bucket.

    Only paths below toolkit/ are accepted. This prevents an admin toolkit
    action from accidentally deleting unrelated newsroom/profile storage.
    """
    clean = []
    for raw in paths:
        if not raw:
            continue
        path = str(raw).strip().lstrip('/')
        if not path.startswith('toolkit/'):
            continue
        if path not in clean:
            clean.append(path)

    if not clean:
        return
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise AppError('storage_not_configured', 'Storage service is not configured.', 503)

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    result = client.storage.from_(settings.storage_bucket).remove(clean)
    # supabase-py raises for transport/auth errors. Some versions return an
    # object/dict; no additional response parsing is needed for successful removal.
    return None
