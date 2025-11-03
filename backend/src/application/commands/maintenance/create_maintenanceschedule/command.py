from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateMaintenanceScheduleCommand(ICommand):
    tenant_id: str
    assigned_technician_id: str
    category: str
    created_by_id: str
    description: str
    equipment_id: str
    estimated_cost: Optional[float] = 0.0
    estimated_duration_hours: Optional[float] = 0.0
    location: str
    maintenance_procedures: Optional[List[str]] = None
    maintenance_type: str
    priority: str
    required_parts: Optional[List[str]] = None
    required_tools: Optional[List[str]] = None
    safety_requirements: Optional[List[str]] = None
    scheduled_date: datetime
    tags: Optional[List[str]] = None
    title: str
    updated_by_id: str
    created_by: Optional[str] = None
