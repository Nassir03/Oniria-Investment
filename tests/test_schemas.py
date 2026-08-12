import pytest
from pydantic import ValidationError
from app.schemas.lead import LeadCreate


def test_lead_requires_consent():
    with pytest.raises(ValidationError):
        LeadCreate(first_name='A', last_name='B', email='a@example.com', message='Hello there', consent=False)
