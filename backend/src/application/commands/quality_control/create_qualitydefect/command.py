from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateQualityDefectCommand(ICommand):
    tenant_id: str
    actual_resolution_date: datetime
    assigned_to_id: str
    category: str
    cost_impact: Optional[float] = 0.0
    defect_number: str
    description: str
    detected_by_id: str
    detected_date: datetime
    estimated_resolution_date: datetime
    location: str
    priority: str
    production_plan_id: str
    project_id: str
    quality_check_id: str
    resolution_notes: str
    severity: str
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    title: str
    work_order_id: str
    created_by: Optional[str] = None
