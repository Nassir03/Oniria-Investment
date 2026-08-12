import re
import secrets
from pathlib import PurePosixPath
from supabase import create_client

from app.core.config import settings
from app.core.errors import AppError


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
    if not settings.supabase_service_role_key:
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
