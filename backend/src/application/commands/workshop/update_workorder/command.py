from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateWorkOrderCommand(ICommand):
    tenant_id: str
    workorder_id: str
    actual_cost: Optional[float] = None
    actual_end_date: Optional[datetime] = None
    actual_hours: Optional[float] = None
    actual_start_date: Optional[datetime] = None
    approved_by_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    attachments: Optional[List[str]] = None
    completion_percentage: Optional[float] = None
    created_by_id: Optional[str] = None
    current_step: Optional[str] = None
    description: Optional[str] = None
    equipment_id: Optional[str] = None
    estimated_cost: Optional[float] = None
    estimated_hours: Optional[float] = None
    instructions: Optional[str] = None
    is_active: Optional[bool] = None
    location: Optional[str] = None
    materials_required: Optional[List[str]] = None
    notes: Optional[List[str]] = None
    planned_end_date: Optional[datetime] = None
    planned_start_date: Optional[datetime] = None
    priority: Optional[str] = None
    project_id: Optional[str] = None
    quality_requirements: Optional[str] = None
    safety_notes: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    title: Optional[str] = None
    work_order_number: Optional[str] = None
    work_order_type: Optional[str] = None
