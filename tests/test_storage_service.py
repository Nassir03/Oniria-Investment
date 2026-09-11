from io import BytesIO
from uuid import UUID

import pytest
from fastapi import UploadFile

from app.core.errors import AppError
from app.services import storage_service


class FakeBucket:
    def __init__(self):
        self.uploads = []
        self.removed = []

    def upload(self, path, file, file_options=None):
        self.uploads.append((path, file, file_options))
        return {'path': path}

    def create_signed_upload_url(self, path):
        self.uploads.append((path, None, None))
        return {'token': 'signed-token', 'signedURL': f'https://storage.example/upload/{path}?token=signed-token'}

    def remove(self, paths):
        self.removed.extend(paths)
        return [{'name': path} for path in paths]


class FakeStorage:
    def __init__(self, bucket):
        self.bucket = bucket

    def from_(self, bucket_name):
        assert bucket_name == 'oniria-media'
        return self.bucket


class FakeClient:
    def __init__(self, bucket):
        self.storage = FakeStorage(bucket)


def install_fake_storage(monkeypatch):
    bucket = FakeBucket()
    monkeypatch.setattr(storage_service.settings, 'supabase_url', 'https://example.supabase.co')
    monkeypatch.setattr(storage_service.settings, 'supabase_service_role_key', 'service-role')
    monkeypatch.setattr(storage_service.settings, 'storage_bucket', 'oniria-media')
    monkeypatch.setattr(storage_service, 'create_client', lambda *_: FakeClient(bucket))
    return bucket


@pytest.mark.asyncio
async def test_newsroom_upload_goes_to_supabase_newsroom_folder(monkeypatch):
    bucket = install_fake_storage(monkeypatch)
    upload = UploadFile(BytesIO(b'image-bytes'), filename='hero.png')
    upload.headers = {'content-type': 'image/png'}

    result = await storage_service.save_newsroom_image(upload)

    path, raw, options = bucket.uploads[0]
    assert path.startswith('newsroom/newsroom-')
    assert path.endswith('.png')
    assert raw == b'image-bytes'
    assert options['content-type'] == 'image/png'
    assert result == {
        'url': f'https://example.supabase.co/storage/v1/object/public/oniria-media/{path}',
        'path': path,
    }


@pytest.mark.asyncio
async def test_profile_upload_goes_to_supabase_staff_folder(monkeypatch):
    bucket = install_fake_storage(monkeypatch)
    user_id = UUID('11111111-1111-1111-1111-111111111111')
    upload = UploadFile(BytesIO(b'avatar-bytes'), filename='avatar.webp')
    upload.headers = {'content-type': 'image/webp'}

    result = await storage_service.save_profile_image(upload, user_id)

    path, raw, options = bucket.uploads[0]
    assert path.startswith(f'staff/{user_id}-')
    assert path.endswith('.webp')
    assert raw == b'avatar-bytes'
    assert options['content-type'] == 'image/webp'
    assert result['path'] == path
    assert result['url'].endswith(f'/oniria-media/{path}')


def test_delete_storage_files_allows_only_managed_prefixes(monkeypatch):
    bucket = install_fake_storage(monkeypatch)

    storage_service.delete_storage_files([
        'toolkit/deck.pdf',
        '/newsroom/hero.png',
        'staff/avatar.webp',
        'other/ignore-me.png',
    ])

    assert bucket.removed == [
        'toolkit/deck.pdf',
        'newsroom/hero.png',
        'staff/avatar.webp',
    ]


def test_signed_upload_defaults_to_toolkit_folder(monkeypatch):
    bucket = install_fake_storage(monkeypatch)

    result = storage_service.create_signed_upload('deck.pdf', 'application/pdf', 123, 'toolkit')

    path, raw, options = bucket.uploads[0]
    assert path.startswith('toolkit/')
    assert path.endswith('-deck.pdf')
    assert raw is None
    assert options is None
    assert result['path'] == path
    assert result['token'] == 'signed-token'


def test_signed_upload_rejects_unmanaged_folder(monkeypatch):
    install_fake_storage(monkeypatch)

    with pytest.raises(AppError, match='Uploads must use toolkit'):
        storage_service.create_signed_upload('deck.pdf', 'application/pdf', 123, 'admin')
