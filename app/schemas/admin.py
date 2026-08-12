from uuid import UUID
from pydantic import BaseModel, EmailStr


class CurrentStaff(BaseModel):
    id: UUID
    email: EmailStr | None
    full_name: str | None
    roles: list[str]


class UploadSignRequest(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    folder: str = 'admin'


class UploadSignResponse(BaseModel):
    path: str
    token: str
    signed_url: str | None = None
