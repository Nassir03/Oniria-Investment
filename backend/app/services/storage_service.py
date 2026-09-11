import re
import secrets
from pathlib import Path, PurePosixPath
from uuid import UUID

from fastapi import UploadFile
from supabase import create_client

from app.core.config import settings
from app.core.errors import AppError


IMAGE_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/avif'}
SIGNED_UPLOAD_CONTENT_TYPES = IMAGE_CONTENT_TYPES | {'application/pdf', 'video/mp4', 'video/webm'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif'}
UPLOAD_STORAGE_PREFIXES = ('toolkit/', 'newsroom/', 'staff/')


def _safe_filename(name: str) -> str:
    name = PurePosixPath(name).name
    name = re.sub(r'[^A-Za-z0-9._-]+', '-', name).strip('-')
    if not name or name.startswith('.'):
        raise AppError('invalid_filename', 'Invalid filename.', 400)
    return name


def _storage_client():
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise AppError('storage_not_configured', 'Storage service is not configured.', 503)
    return create_client(settings.supabase_url, settings.supabase_secret_key)


def _storage_public_url(path: str) -> str:
    return (
        f'{settings.supabase_url.rstrip("/")}/storage/v1/object/public/'
        f'{settings.storage_bucket}/{path.lstrip("/")}'
    )


def _is_managed_storage_folder(folder: str) -> bool:
    return any(folder == prefix.rstrip('/') or folder.startswith(prefix) for prefix in UPLOAD_STORAGE_PREFIXES)


async def _read_image_upload(file: UploadFile) -> tuple[bytes, str, str]:
    content_type = (file.content_type or '').lower()
    if content_type not in IMAGE_CONTENT_TYPES:
        raise AppError('unsupported_file_type', 'Use JPG, PNG, WEBP or AVIF images.', 400)

    raw = await file.read(settings.max_upload_bytes + 1)
    if not raw:
        raise AppError('empty_upload', 'The uploaded image is empty.', 400)
    if len(raw) > settings.max_upload_bytes:
        raise AppError('invalid_file_size', f'Image must be smaller than {settings.max_upload_bytes} bytes.', 400)

    safe = _safe_filename(file.filename or 'image')
    extension = Path(safe).suffix.lower()
    if extension not in IMAGE_EXTENSIONS:
        extension = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/avif': '.avif',
        }.get(content_type, '.jpg')

    return raw, content_type, extension


async def _save_storage_image(file: UploadFile, folder: str, filename_prefix: str) -> dict:
    raw, content_type, extension = await _read_image_upload(file)
    folder = re.sub(r'[^A-Za-z0-9/_-]+', '-', folder).strip('/')
    if folder not in {'newsroom', 'staff'}:
        raise AppError('invalid_storage_folder', 'Invalid storage folder.', 400)

    path = f'{folder}/{filename_prefix}-{secrets.token_hex(12)}{extension}'
    client = _storage_client()
    client.storage.from_(settings.storage_bucket).upload(
        path,
        raw,
        {'content-type': content_type, 'cache-control': '31536000'},
    )
    return {'url': _storage_public_url(path), 'path': path}


def create_signed_upload(filename: str, content_type: str, size_bytes: int, folder: str) -> dict:
    allowed_types = set(settings.allowed_upload_mime_types) | SIGNED_UPLOAD_CONTENT_TYPES
    if content_type not in allowed_types:
        raise AppError('unsupported_file_type', 'This file type is not allowed.', 400)
    if size_bytes <= 0 or size_bytes > settings.max_upload_bytes:
        raise AppError('invalid_file_size', f'Upload must be between 1 and {settings.max_upload_bytes} bytes.', 400)
    safe = _safe_filename(filename)
    folder = re.sub(r'[^A-Za-z0-9/_-]+', '-', folder).strip('/') or 'admin'
    if not _is_managed_storage_folder(folder):
        raise AppError('invalid_storage_folder', 'Uploads must use toolkit, newsroom or staff storage.', 400)
    path = f'{folder}/{secrets.token_hex(8)}-{safe}'

    client = _storage_client()
    result = client.storage.from_(settings.storage_bucket).create_signed_upload_url(path)
    if not isinstance(result, dict):
        result = getattr(result, 'model_dump', lambda: {})()
    return {
        'path': path,
        'token': result.get('token') or result.get('signedURL', '').split('token=')[-1],
        'signed_url': result.get('signedURL') or result.get('signed_url'),
    }


async def save_newsroom_image(file: UploadFile) -> dict:
    """Store a newsroom image in Supabase Storage and return its public URL."""
    return await _save_storage_image(file, 'newsroom', 'newsroom')


async def save_profile_image(file: UploadFile, user_id: UUID) -> dict:
    """Store a staff profile image in Supabase Storage and return its public URL."""
    return await _save_storage_image(file, 'staff', str(user_id))


def delete_storage_files(paths: list[str | None]) -> None:
    """Delete managed objects from the configured Supabase Storage bucket."""
    clean = []
    for raw in paths:
        if not raw:
            continue
        path = str(raw).strip().lstrip('/')
        if not path.startswith(UPLOAD_STORAGE_PREFIXES):
            continue
        if path not in clean:
            clean.append(path)

    if not clean:
        return

    client = _storage_client()
    result = client.storage.from_(settings.storage_bucket).remove(clean)
    # supabase-py raises for transport/auth errors. Some versions return an
    # object/dict; no additional response parsing is needed for successful removal.
    return None
