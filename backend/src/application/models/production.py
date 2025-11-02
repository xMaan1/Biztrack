from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class ProductionStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProductionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProductionType(str, Enum):
    BATCH = "batch"
    CONTINUOUS = "continuous"
    JOB_SHOP = "job_shop"
    ASSEMBLY = "assembly"
    CUSTOM = "custom"

# Base Models
class ProductionPlanBase(BaseModel):
    title: str = Field(..., description="Production plan title")
    description: Optional[str] = Field(None, description="Production plan description")
    production_type: ProductionType = Field(ProductionType.BATCH, description="Type of production")
    priority: ProductionPriority = Field(ProductionPriority.MEDIUM, description="Production priority")
    planned_start_date: Optional[datetime] = Field(None, description="Planned start date")
    planned_end_date: Optional[datetime] = Field(None, description="Planned end date")
    target_quantity: int = Field(0, description="Target production quantity")
    unit_of_measure: str = Field("pieces", description="Unit of measure for quantity")
    production_line: Optional[str] = Field(None, description="Production line identifier")
    equipment_required: List[str] = Field(default_factory=list, description="Required equipment")
    materials_required: List[Dict[str, Any]] = Field(default_factory=list, description="Required materials")
    labor_requirements: List[Dict[str, Any]] = Field(default_factory=list, description="Labor requirements")
    estimated_material_cost: float = Field(0.0, description="Estimated material cost")
    estimated_labor_cost: float = Field(0.0, description="Estimated labor cost")
    quality_standards: Optional[str] = Field(None, description="Quality standards")
    inspection_points: List[Dict[str, Any]] = Field(default_factory=list, description="Inspection points")
    tolerance_specs: List[Dict[str, Any]] = Field(default_factory=list, description="Tolerance specifications")
    project_id: Optional[str] = Field(None, description="Associated project ID")
    work_order_id: Optional[str] = Field(None, description="Associated work order ID")
    assigned_to_id: Optional[str] = Field(None, description="Assigned user ID")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

class ProductionStepBase(BaseModel):
    step_number: int = Field(..., description="Step sequence number")
    step_name: str = Field(..., description="Step name")
    description: Optional[str] = Field(None, description="Step description")
    estimated_duration_minutes: int = Field(0, description="Estimated duration in minutes")
    equipment_required: List[str] = Field(default_factory=list, description="Required equipment")
    materials_consumed: List[Dict[str, Any]] = Field(default_factory=list, description="Materials consumed")
    labor_required: List[Dict[str, Any]] = Field(default_factory=list, description="Labor required")
    quality_checkpoints: List[Dict[str, Any]] = Field(default_factory=list, description="Quality checkpoints")
    inspection_required: bool = Field(False, description="Whether inspection is required")
    depends_on_steps: List[int] = Field(default_factory=list, description="Dependent step numbers")
    notes: Optional[str] = Field(None, description="Additional notes")

class ProductionScheduleBase(BaseModel):
    scheduled_start: datetime = Field(..., description="Scheduled start time")
    scheduled_end: datetime = Field(..., description="Scheduled end time")
    resource_allocation: Dict[str, Any] = Field(default_factory=dict, description="Resource allocation")
    capacity_utilization: float = Field(0.0, description="Capacity utilization percentage")
    constraints: List[str] = Field(default_factory=list, description="Scheduling constraints")
    dependencies: List[str] = Field(default_factory=list, description="Dependent production plans")

# Create Models
class ProductionPlanCreate(ProductionPlanBase):
    pass

class ProductionStepCreate(ProductionStepBase):
    pass

class ProductionScheduleCreate(ProductionScheduleBase):
    production_plan_id: str = Field(..., description="Production plan ID")

# Update Models
class ProductionPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    production_type: Optional[ProductionType] = None
    status: Optional[ProductionStatus] = None
    priority: Optional[ProductionPriority] = None
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    target_quantity: Optional[int] = None
    actual_quantity: Optional[int] = None
    unit_of_measure: Optional[str] = None
    production_line: Optional[str] = None
    equipment_required: Optional[List[str]] = None
    materials_required: Optional[List[Dict[str, Any]]] = None
    labor_requirements: Optional[List[Dict[str, Any]]] = None
    estimated_material_cost: Optional[float] = None
    estimated_labor_cost: Optional[float] = None
    actual_material_cost: Optional[float] = None
    actual_labor_cost: Optional[float] = None
    quality_standards: Optional[str] = None
    inspection_points: Optional[List[Dict[str, Any]]] = None
    tolerance_specs: Optional[List[Dict[str, Any]]] = None
    project_id: Optional[str] = None
    work_order_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    completion_percentage: Optional[float] = None
    current_step: Optional[str] = None
    notes: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None

class ProductionStepUpdate(BaseModel):
    step_name: Optional[str] = None
    description: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    actual_duration_minutes: Optional[int] = None
    status: Optional[str] = None
    equipment_required: Optional[List[str]] = None
    materials_consumed: Optional[List[Dict[str, Any]]] = None
    labor_required: Optional[List[Dict[str, Any]]] = None
    quality_checkpoints: Optional[List[Dict[str, Any]]] = None
    inspection_required: Optional[bool] = None
    depends_on_steps: Optional[List[int]] = None
    notes: Optional[str] = None

class ProductionScheduleUpdate(BaseModel):
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    resource_allocation: Optional[Dict[str, Any]] = None
    capacity_utilization: Optional[float] = None
    constraints: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    status: Optional[str] = None

# Response Models
class ProductionStepResponse(ProductionStepBase):
    id: str
    production_plan_id: str
    status: str
    actual_duration_minutes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductionScheduleResponse(ProductionScheduleBase):
    id: str
    production_plan_id: str
    tenant_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductionPlanResponse(ProductionPlanBase):
    id: str
    tenant_id: str
    plan_number: str
    status: ProductionStatus
    actual_start_date: Optional[datetime]
    actual_end_date: Optional[datetime]
    estimated_duration_hours: float
    actual_duration_hours: float
    actual_quantity: int
    completion_percentage: float
    current_step: Optional[str]
    notes: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    production_steps: List[ProductionStepResponse] = []
    production_schedules: List[ProductionScheduleResponse] = []

    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        data = {
            'id': str(obj.id),
            'tenant_id': str(obj.tenant_id),
            'plan_number': obj.plan_number,
            'title': obj.title,
            'description': obj.description,
            'production_type': obj.production_type,
            'status': obj.status,
            'priority': obj.priority,
            'planned_start_date': obj.planned_start_date,
            'planned_end_date': obj.planned_end_date,
            'actual_start_date': obj.actual_start_date,
            'actual_end_date': obj.actual_end_date,
            'target_quantity': obj.target_quantity,
            'actual_quantity': obj.actual_quantity,
            'unit_of_measure': obj.unit_of_measure,
            'production_line': obj.production_line,
            'equipment_required': obj.equipment_required or [],
            'materials_required': obj.materials_required or [],
            'labor_requirements': obj.labor_requirements or [],
            'estimated_material_cost': obj.estimated_material_cost,
            'estimated_labor_cost': obj.estimated_labor_cost,
            'actual_material_cost': obj.actual_material_cost,
            'actual_labor_cost': obj.actual_labor_cost,
            'quality_standards': obj.quality_standards,
            'inspection_points': obj.inspection_points or [],
            'tolerance_specs': obj.tolerance_specs or [],
            'project_id': str(obj.project_id) if obj.project_id else None,
            'work_order_id': str(obj.work_order_id) if obj.work_order_id else None,
            'assigned_to_id': str(obj.assigned_to_id) if obj.assigned_to_id else None,
            'estimated_duration_hours': obj.estimated_duration_hours,
            'actual_duration_hours': obj.actual_duration_hours,
            'completion_percentage': obj.completion_percentage,
            'current_step': obj.current_step,
            'notes': obj.notes or [],
            'tags': obj.tags or [],
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'production_steps': [],
            'production_schedules': []
        }
        return cls(**data)

# List Response Models
class ProductionPlansResponse(BaseModel):
    production_plans: List[ProductionPlanResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class ProductionStepsResponse(BaseModel):
    production_steps: List[ProductionStepResponse]
    total: int

class ProductionSchedulesResponse(BaseModel):
    production_schedules: List[ProductionScheduleResponse]
    total: int

# Dashboard Models
class ProductionDashboardStats(BaseModel):
    total_plans: int
    status_counts: Dict[str, int]
    priority_counts: Dict[str, int]
    completion_rate: float
    completed_plans: int
    in_progress_plans: int
    planned_plans: int
    on_hold_plans: int
    cancelled_plans: int

class ProductionDashboard(BaseModel):
    stats: ProductionDashboardStats
    recent_plans: List[ProductionPlanResponse]
    upcoming_deadlines: List[ProductionPlanResponse]
    priority_alerts: List[ProductionPlanResponse]

# Filter Models
class ProductionPlanFilters(BaseModel):
    status: Optional[ProductionStatus] = None
    priority: Optional[ProductionPriority] = None
    production_type: Optional[ProductionType] = None
    project_id: Optional[str] = None
    work_order_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    planned_start_date_from: Optional[datetime] = None
    planned_start_date_to: Optional[datetime] = None
    planned_end_date_from: Optional[datetime] = None
    planned_end_date_to: Optional[datetime] = None
    search: Optional[str] = None
