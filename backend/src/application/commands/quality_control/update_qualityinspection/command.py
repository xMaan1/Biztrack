from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateQualityInspectionCommand(ICommand):
    tenant_id: str
    qualityinspection_id: str
    compliance_score: Optional[float] = None
    corrective_actions: Optional[List[str]] = None
    defects_found: Optional[List[str]] = None
    documents: Optional[List[str]] = None
    inspection_date: Optional[datetime] = None
    inspector_id: Optional[str] = None
    measurements: Optional[List[str]] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None
    quality_check_id: Optional[str] = None
    results: Optional[List[str]] = None
    status: Optional[str] = None
