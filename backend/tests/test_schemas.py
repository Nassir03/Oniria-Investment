import pytest
from pydantic import ValidationError
from app.schemas.lead import LeadCreate
from app.schemas.toolkit import ToolkitAssetCreate


def test_lead_requires_consent():
    with pytest.raises(ValidationError):
        LeadCreate(first_name='A', last_name='B', email='a@example.com', message='Hello there', consent=False)


def test_toolkit_accepts_public_and_site_relative_links():
    common = {
        'project_slug': 'all-projects',
        'category': 'brochure',
        'title': 'Brochure',
        'media_type': 'pdf',
    }
    external = ToolkitAssetCreate(
        **common,
        file_url='https://drive.google.com/file/d/example/view',
        preview_image_url='https://example.com/cover.jpg',
    )
    local = ToolkitAssetCreate(**common, file_url='/images/toolkit/example.pdf')

    assert external.file_url.startswith('https://')
    assert local.file_url.startswith('/')


def test_toolkit_rejects_unsafe_link_schemes():
    with pytest.raises(ValidationError):
        ToolkitAssetCreate(
            project_slug='all-projects',
            category='logo',
            title='Logo',
            media_type='image',
            file_url='javascript:alert(1)',
        )
