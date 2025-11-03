from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateMaintenanceScheduleCommand(ICommand):
    tenant_id: str
    maintenanceschedule_id: str
    assigned_technician_id: Optional[str] = None
    category: Optional[str] = None
    created_by_id: Optional[str] = None
    description: Optional[str] = None
    equipment_id: Optional[str] = None
    estimated_cost: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    location: Optional[str] = None
    maintenance_procedures: Optional[List[str]] = None
    maintenance_type: Optional[str] = None
    priority: Optional[str] = None
    required_parts: Optional[List[str]] = None
    required_tools: Optional[List[str]] = None
    safety_requirements: Optional[List[str]] = None
    scheduled_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    title: Optional[str] = None
    updated_by_id: Optional[str] = None
