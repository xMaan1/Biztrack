from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateProductionScheduleCommand(ICommand):
    tenant_id: str
    productionschedule_id: str
    capacity_utilization: Optional[float] = None
    constraints: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    production_plan_id: Optional[str] = None
    resource_allocation: Optional[List[str]] = None
    scheduled_end: Optional[datetime] = None
    scheduled_start: Optional[datetime] = None
    status: Optional[str] = None
