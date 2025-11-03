from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateEquipmentInvestmentCommand(ICommand):
    tenant_id: str
    attachments: Optional[List[str]] = None
    condition: Optional[str] = None
    created_by: str
    depreciation_method: Optional[str] = None
    equipment_name: str
    equipment_type: str
    estimated_life_years: Optional[int] = 0
    investment_id: str
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    notes: Optional[str] = None
    purchase_date: datetime
    purchase_price: float
    serial_number: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
    created_by: Optional[str] = None
