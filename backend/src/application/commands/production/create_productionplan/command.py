from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateProductionPlanCommand(ICommand):
    tenant_id: str
    actual_duration_hours: Optional[float] = 0.0
    actual_end_date: datetime
    actual_labor_cost: Optional[float] = 0.0
    actual_material_cost: Optional[float] = 0.0
    actual_quantity: Optional[int] = 0
    actual_start_date: datetime
    approved_by_id: str
    assigned_to_id: str
    completion_percentage: Optional[float] = 0.0
    created_by_id: str
    current_step: str
    description: str
    equipment_required: Optional[List[str]] = None
    estimated_duration_hours: Optional[float] = 0.0
    estimated_labor_cost: Optional[float] = 0.0
    estimated_material_cost: Optional[float] = 0.0
    inspection_points: Optional[List[str]] = None
    labor_requirements: Optional[List[str]] = None
    materials_required: Optional[List[str]] = None
    notes: Optional[List[str]] = None
    plan_number: str
    planned_end_date: datetime
    planned_start_date: datetime
    priority: str
    production_line: str
    production_type: str
    project_id: str
    quality_standards: str
    status: str
    tags: Optional[List[str]] = None
    target_quantity: Optional[int] = 0
    title: str
    tolerance_specs: Optional[List[str]] = None
    unit_of_measure: Optional[str] = None
    work_order_id: str
    created_by: Optional[str] = None
