from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateQualityCheckCommand(ICommand):
    tenant_id: str
    acceptance_criteria: Optional[List[str]] = None
    assigned_to_id: str
    check_number: str
    completion_percentage: Optional[float] = 0.0
    created_by_id: str
    criteria: Optional[List[str]] = None
    current_step: str
    description: str
    estimated_duration_minutes: Optional[int] = 0
    inspection_type: str
    notes: Optional[List[str]] = None
    priority: str
    production_plan_id: str
    project_id: str
    quality_standard: str
    required_equipment: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    scheduled_date: datetime
    status: str
    tags: Optional[List[str]] = None
    title: str
    tolerance_limits: Optional[List[str]] = None
    work_order_id: str
    created_by: Optional[str] = None
