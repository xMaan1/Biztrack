from pydantic import BaseModel


class TenantStatusUpdate(BaseModel):
    is_active: bool


class TenantDeleteRequest(BaseModel):
    deleteAllData: bool = False
