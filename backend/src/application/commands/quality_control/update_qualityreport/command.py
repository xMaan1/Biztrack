from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateQualityReportCommand(ICommand):
    tenant_id: str
    qualityreport_id: str
    generated_by_id: Optional[str] = None
    key_findings: Optional[List[str]] = None
    metrics: Optional[List[str]] = None
    period_end: Optional[datetime] = None
    period_start: Optional[datetime] = None
    recommendations: Optional[List[str]] = None
    report_number: Optional[str] = None
    report_type: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    title: Optional[str] = None
