from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LeadCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=60)
    country: str | None = Field(default=None, max_length=120)
    enquiry_type: str | None = Field(default=None, max_length=100)
    project_id: UUID | None = None
    message: str = Field(min_length=5, max_length=5000)
    preferred_contact_method: str | None = Field(default=None, max_length=30)
    consent: bool
    honeypot: str | None = Field(default=None, max_length=200, exclude=True)

    @field_validator('consent')
    @classmethod
    def consent_required(cls, value: bool):
        if not value:
            raise ValueError('Consent is required')
        return value


class LeadCreated(BaseModel):
    id: UUID
    reference_no: str
    message: str = 'Thank you. Your enquiry has been received.'


class LeadNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    staff_id: UUID | None
    note: str
    created_at: datetime


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    reference_no: str
    source: str
    project_id: UUID | None
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None
    country: str | None
    enquiry_type: str | None
    preferred_contact_method: str | None
    message: str
    consent: bool
    status: str
    assigned_to: UUID | None
    notes: list[LeadNoteOut] = []
    created_at: datetime
    updated_at: datetime


class LeadUpdate(BaseModel):
    status: str | None = None
    assigned_to: UUID | None = None
    note: str | None = Field(default=None, min_length=1, max_length=4000)
