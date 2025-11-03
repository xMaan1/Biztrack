from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateQualityInspectionCommand(ICommand):
    tenant_id: str
    compliance_score: Optional[float] = 0.0
    corrective_actions: Optional[List[str]] = None
    defects_found: Optional[List[str]] = None
    documents: Optional[List[str]] = None
    inspection_date: datetime
    inspector_id: str
    measurements: Optional[List[str]] = None
    notes: str
    photos: Optional[List[str]] = None
    quality_check_id: str
    results: Optional[List[str]] = None
    status: str
    created_by: Optional[str] = None
