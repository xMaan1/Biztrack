from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
