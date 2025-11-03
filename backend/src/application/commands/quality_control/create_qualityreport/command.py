from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateQualityReportCommand(ICommand):
    tenant_id: str
    generated_by_id: str
    key_findings: Optional[List[str]] = None
    metrics: Optional[List[str]] = None
    period_end: datetime
    period_start: datetime
    recommendations: Optional[List[str]] = None
    report_number: str
    report_type: str
    summary: str
    tags: Optional[List[str]] = None
    title: str
    created_by: Optional[str] = None
