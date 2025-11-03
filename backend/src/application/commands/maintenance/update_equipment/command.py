from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateEquipmentCommand(ICommand):
    tenant_id: str
    equipment_id: str
    assigned_technicians: Optional[List[str]] = None
    category: Optional[str] = None
    created_by_id: Optional[str] = None
    critical_spare_parts: Optional[List[str]] = None
    installation_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    location: Optional[str] = None
    maintenance_history: Optional[List[str]] = None
    maintenance_interval_hours: Optional[int] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    name: Optional[str] = None
    next_maintenance_date: Optional[datetime] = None
    operating_hours: Optional[float] = None
    operating_instructions: Optional[str] = None
    safety_guidelines: Optional[List[str]] = None
    serial_number: Optional[str] = None
    specifications: Optional[List[str]] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    updated_by_id: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
