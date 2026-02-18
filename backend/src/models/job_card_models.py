from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class JobCardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "draft"
    priority: str = "medium"
    work_order_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    assigned_to_id: Optional[str] = None
    planned_date: Optional[datetime] = None
    labor_estimate: float = 0.0
    parts_estimate: float = 0.0
    notes: Optional[str] = None
    attachments: Optional[List[str]] = None
    items: Optional[List[Dict[str, Any]]] = None


class JobCardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    work_order_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    assigned_to_id: Optional[str] = None
    planned_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    labor_estimate: Optional[float] = None
    parts_estimate: Optional[float] = None
    notes: Optional[str] = None
    attachments: Optional[List[str]] = None
    items: Optional[List[Dict[str, Any]]] = None


class JobCardResponse(BaseModel):
    id: str
    tenant_id: str
    job_card_number: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    work_order_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    assigned_to_id: Optional[str] = None
    created_by_id: str
    planned_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    labor_estimate: float
    parts_estimate: float
    notes: Optional[str] = None
    attachments: List[str]
    items: List[Dict[str, Any]]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
