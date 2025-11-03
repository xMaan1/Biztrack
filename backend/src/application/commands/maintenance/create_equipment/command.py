from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateEquipmentCommand(ICommand):
    tenant_id: str
    assigned_technicians: Optional[List[str]] = None
    category: str
    created_by_id: str
    critical_spare_parts: Optional[List[str]] = None
    installation_date: datetime
    last_maintenance_date: datetime
    location: str
    maintenance_history: Optional[List[str]] = None
    maintenance_interval_hours: int
    manufacturer: str
    model: str
    name: str
    next_maintenance_date: datetime
    operating_hours: Optional[float] = 0.0
    operating_instructions: str
    safety_guidelines: Optional[List[str]] = None
    serial_number: str
    specifications: Optional[List[str]] = None
    status: str
    tags: Optional[List[str]] = None
    updated_by_id: str
    warranty_expiry: datetime
    created_by: Optional[str] = None
