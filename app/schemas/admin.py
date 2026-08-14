from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


class CurrentStaff(BaseModel):
    id: UUID
    email: EmailStr | None
    full_name: str | None
    roles: list[str]


class StaffOut(BaseModel):
    id: UUID
    email: EmailStr | None
    full_name: str | None
    status: str
    roles: list[str]
    created_at: datetime
    updated_at: datetime


class StaffCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=8, max_length=128)
    roles: list[str] = Field(min_length=1)

    @field_validator('password')
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError('Password must include uppercase, lowercase and a number.')
        return value


class StaffUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    status: str | None = None
    roles: list[str] | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def optional_password_strength(cls, value: str | None) -> str | None:
        if value is not None and (not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value)):
            raise ValueError('Password must include uppercase, lowercase and a number.')
        return value


class UploadSignRequest(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    folder: str = 'admin'


class UploadSignResponse(BaseModel):
    path: str
    token: str
    signed_url: str | None = None
