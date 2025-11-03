from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateProductionStepCommand(ICommand):
    tenant_id: str
    actual_duration_minutes: Optional[int] = 0
    depends_on_steps: Optional[List[str]] = None
    description: str
    equipment_required: Optional[List[str]] = None
    estimated_duration_minutes: Optional[int] = 0
    inspection_required: Optional[bool] = False
    labor_required: Optional[List[str]] = None
    materials_consumed: Optional[List[str]] = None
    notes: str
    production_plan_id: str
    quality_checkpoints: Optional[List[str]] = None
    status: Optional[str] = None
    step_name: str
    step_number: int
    created_by: Optional[str] = None
