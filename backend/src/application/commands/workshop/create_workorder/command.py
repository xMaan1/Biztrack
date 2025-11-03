from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateWorkOrderCommand(ICommand):
    tenant_id: str
    actual_cost: Optional[float] = 0.0
    actual_end_date: datetime
    actual_hours: Optional[float] = 0.0
    actual_start_date: datetime
    approved_by_id: str
    assigned_to_id: str
    attachments: Optional[List[str]] = None
    completion_percentage: Optional[float] = 0.0
    created_by_id: str
    current_step: str
    description: str
    equipment_id: str
    estimated_cost: Optional[float] = 0.0
    estimated_hours: Optional[float] = 0.0
    instructions: str
    is_active: Optional[bool] = False
    location: str
    materials_required: Optional[List[str]] = None
    notes: Optional[List[str]] = None
    planned_end_date: datetime
    planned_start_date: datetime
    priority: str
    project_id: str
    quality_requirements: str
    safety_notes: str
    status: str
    tags: Optional[List[str]] = None
    title: str
    work_order_number: str
    work_order_type: str
    created_by: Optional[str] = None
