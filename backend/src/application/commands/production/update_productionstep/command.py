from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateProductionStepCommand(ICommand):
    tenant_id: str
    productionstep_id: str
    actual_duration_minutes: Optional[int] = None
    depends_on_steps: Optional[List[str]] = None
    description: Optional[str] = None
    equipment_required: Optional[List[str]] = None
    estimated_duration_minutes: Optional[int] = None
    inspection_required: Optional[bool] = None
    labor_required: Optional[List[str]] = None
    materials_consumed: Optional[List[str]] = None
    notes: Optional[str] = None
    production_plan_id: Optional[str] = None
    quality_checkpoints: Optional[List[str]] = None
    status: Optional[str] = None
    step_name: Optional[str] = None
    step_number: Optional[int] = None
