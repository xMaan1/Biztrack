from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateEquipmentInvestmentCommand(ICommand):
    tenant_id: str
    equipmentinvestment_id: str
    attachments: Optional[List[str]] = None
    condition: Optional[str] = None
    created_by: Optional[str] = None
    depreciation_method: Optional[str] = None
    equipment_name: Optional[str] = None
    equipment_type: Optional[str] = None
    estimated_life_years: Optional[int] = None
    investment_id: Optional[str] = None
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    notes: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = None
    serial_number: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
