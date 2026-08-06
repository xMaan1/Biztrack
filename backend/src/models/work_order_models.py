from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WorkOrderBase(BaseModel):
    title: str
    description: Optional[str] = None
    work_order_type: str
    status: str
    priority: str
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    estimated_hours: Optional[float] = 0.0
    assigned_to_id: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    quality_requirements: Optional[str] = None
    materials_required: Optional[List[str]] = []
    estimated_cost: Optional[float] = 0.0
    tags: Optional[List[str]] = []


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    work_order_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    assigned_to_id: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    quality_requirements: Optional[str] = None
    materials_required: Optional[List[str]] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    completion_percentage: Optional[float] = None
    current_step: Optional[str] = None
    notes: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None


class WorkOrderResponse(WorkOrderBase):
    id: str
    work_order_number: str
    tenant_id: str
    created_by_id: str
    approved_by_id: Optional[str] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    actual_hours: float
    completion_percentage: float
    current_step: Optional[str] = None
    notes: List[str]
    attachments: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
