from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateQualityDefectCommand(ICommand):
    tenant_id: str
    qualitydefect_id: str
    actual_resolution_date: Optional[datetime] = None
    assigned_to_id: Optional[str] = None
    category: Optional[str] = None
    cost_impact: Optional[float] = None
    defect_number: Optional[str] = None
    description: Optional[str] = None
    detected_by_id: Optional[str] = None
    detected_date: Optional[datetime] = None
    estimated_resolution_date: Optional[datetime] = None
    location: Optional[str] = None
    priority: Optional[str] = None
    production_plan_id: Optional[str] = None
    project_id: Optional[str] = None
    quality_check_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    title: Optional[str] = None
    work_order_id: Optional[str] = None
