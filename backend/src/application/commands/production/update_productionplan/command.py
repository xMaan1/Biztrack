from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateProductionPlanCommand(ICommand):
    tenant_id: str
    productionplan_id: str
    actual_duration_hours: Optional[float] = None
    actual_end_date: Optional[datetime] = None
    actual_labor_cost: Optional[float] = None
    actual_material_cost: Optional[float] = None
    actual_quantity: Optional[int] = None
    actual_start_date: Optional[datetime] = None
    approved_by_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    completion_percentage: Optional[float] = None
    created_by_id: Optional[str] = None
    current_step: Optional[str] = None
    description: Optional[str] = None
    equipment_required: Optional[List[str]] = None
    estimated_duration_hours: Optional[float] = None
    estimated_labor_cost: Optional[float] = None
    estimated_material_cost: Optional[float] = None
    inspection_points: Optional[List[str]] = None
    labor_requirements: Optional[List[str]] = None
    materials_required: Optional[List[str]] = None
    notes: Optional[List[str]] = None
    plan_number: Optional[str] = None
    planned_end_date: Optional[datetime] = None
    planned_start_date: Optional[datetime] = None
    priority: Optional[str] = None
    production_line: Optional[str] = None
    production_type: Optional[str] = None
    project_id: Optional[str] = None
    quality_standards: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    target_quantity: Optional[int] = None
    title: Optional[str] = None
    tolerance_specs: Optional[List[str]] = None
    unit_of_measure: Optional[str] = None
    work_order_id: Optional[str] = None
