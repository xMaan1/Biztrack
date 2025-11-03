from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateQualityCheckCommand(ICommand):
    tenant_id: str
    qualitycheck_id: str
    acceptance_criteria: Optional[List[str]] = None
    assigned_to_id: Optional[str] = None
    check_number: Optional[str] = None
    completion_percentage: Optional[float] = None
    created_by_id: Optional[str] = None
    criteria: Optional[List[str]] = None
    current_step: Optional[str] = None
    description: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    inspection_type: Optional[str] = None
    notes: Optional[List[str]] = None
    priority: Optional[str] = None
    production_plan_id: Optional[str] = None
    project_id: Optional[str] = None
    quality_standard: Optional[str] = None
    required_equipment: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    scheduled_date: Optional[datetime] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    title: Optional[str] = None
    tolerance_limits: Optional[List[str]] = None
    work_order_id: Optional[str] = None
