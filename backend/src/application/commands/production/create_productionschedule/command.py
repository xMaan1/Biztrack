from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateProductionScheduleCommand(ICommand):
    tenant_id: str
    capacity_utilization: Optional[float] = 0.0
    constraints: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    production_plan_id: str
    resource_allocation: Optional[List[str]] = None
    scheduled_end: datetime
    scheduled_start: datetime
    status: Optional[str] = None
    created_by: Optional[str] = None
