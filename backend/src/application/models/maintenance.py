from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID

# Enums
class MaintenanceStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REQUIRES_APPROVAL = "requires_approval"

class MaintenancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class MaintenanceType(str, Enum):
    PREVENTIVE = "preventive"
    CORRECTIVE = "corrective"
    PREDICTIVE = "predictive"
    EMERGENCY = "emergency"
    INSPECTION = "inspection"
    CALIBRATION = "calibration"
    REPAIR = "repair"
    REPLACEMENT = "replacement"

class EquipmentStatus(str, Enum):
    OPERATIONAL = "operational"
    MAINTENANCE = "maintenance"
    REPAIR = "repair"
    OUT_OF_SERVICE = "out_of_service"
    RETIRED = "retired"

class MaintenanceCategory(str, Enum):
    MECHANICAL = "mechanical"
    ELECTRICAL = "electrical"
    ELECTRONIC = "electronic"
    HYDRAULIC = "hydraulic"
    PNEUMATIC = "pneumatic"
    SOFTWARE = "software"
    SAFETY = "safety"
    GENERAL = "general"

# Base Models
class MaintenanceScheduleBase(BaseModel):
    title: str = Field(..., description="Maintenance schedule title")
    description: Optional[str] = Field(None, description="Maintenance description")
    maintenance_type: MaintenanceType = Field(..., description="Type of maintenance")
    priority: MaintenancePriority = Field(MaintenancePriority.MEDIUM, description="Maintenance priority")
    category: MaintenanceCategory = Field(..., description="Maintenance category")
    equipment_id: str = Field(..., description="Equipment ID to maintain")
    location: Optional[str] = Field(None, description="Maintenance location")
    scheduled_date: datetime = Field(..., description="Scheduled maintenance date")
    estimated_duration_hours: float = Field(0.0, description="Estimated duration in hours")
    assigned_technician_id: Optional[str] = Field(None, description="Assigned technician ID")
    required_parts: List[str] = Field(default_factory=list, description="Required parts")
    required_tools: List[str] = Field(default_factory=list, description="Required tools")
    safety_requirements: List[str] = Field(default_factory=list, description="Safety requirements")
    maintenance_procedures: List[str] = Field(default_factory=list, description="Maintenance procedures")
    estimated_cost: float = Field(0.0, description="Estimated maintenance cost")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

class MaintenanceWorkOrderBase(BaseModel):
    maintenance_schedule_id: str = Field(..., description="Associated maintenance schedule ID")
    technician_id: str = Field(..., description="Technician user ID")
    start_time: Optional[datetime] = Field(None, description="Work order start time")
    end_time: Optional[datetime] = Field(None, description="Work order end time")
    status: MaintenanceStatus = Field(MaintenanceStatus.SCHEDULED, description="Work order status")
    actual_duration_hours: Optional[float] = Field(None, description="Actual duration in hours")
    work_performed: List[str] = Field(default_factory=list, description="Work performed")
    parts_used: List[Dict[str, Any]] = Field(default_factory=list, description="Parts used with quantities")
    tools_used: List[str] = Field(default_factory=list, description="Tools used")
    issues_encountered: List[str] = Field(default_factory=list, description="Issues encountered")
    solutions_applied: List[str] = Field(default_factory=list, description="Solutions applied")
    quality_checks: List[Dict[str, Any]] = Field(default_factory=list, description="Quality checks performed")
    photos: List[str] = Field(default_factory=list, description="Photo URLs")
    documents: List[str] = Field(default_factory=list, description="Document URLs")
    notes: Optional[str] = Field(None, description="Additional notes")
    approval_required: bool = Field(False, description="Whether approval is required")
    approved_by_id: Optional[str] = Field(None, description="User who approved the work")

class EquipmentBase(BaseModel):
    name: str = Field(..., description="Equipment name")
    model: Optional[str] = Field(None, description="Equipment model")
    serial_number: Optional[str] = Field(None, description="Equipment serial number")
    manufacturer: Optional[str] = Field(None, description="Equipment manufacturer")
    category: MaintenanceCategory = Field(..., description="Equipment category")
    location: Optional[str] = Field(None, description="Equipment location")
    status: EquipmentStatus = Field(EquipmentStatus.OPERATIONAL, description="Current equipment status")
    installation_date: Optional[datetime] = Field(None, description="Installation date")
    warranty_expiry: Optional[datetime] = Field(None, description="Warranty expiry date")
    last_maintenance_date: Optional[datetime] = Field(None, description="Last maintenance date")
    next_maintenance_date: Optional[datetime] = Field(None, description="Next scheduled maintenance date")
    maintenance_interval_hours: Optional[int] = Field(None, description="Maintenance interval in hours")
    operating_hours: float = Field(0.0, description="Total operating hours")
    specifications: Dict[str, Any] = Field(default_factory=dict, description="Equipment specifications")
    maintenance_history: List[str] = Field(default_factory=list, description="Maintenance history IDs")
    assigned_technicians: List[str] = Field(default_factory=list, description="Assigned technician IDs")
    critical_spare_parts: List[str] = Field(default_factory=list, description="Critical spare parts")
    operating_instructions: Optional[str] = Field(None, description="Operating instructions")
    safety_guidelines: List[str] = Field(default_factory=list, description="Safety guidelines")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

class MaintenanceReportBase(BaseModel):
    title: str = Field(..., description="Report title")
    description: Optional[str] = Field(None, description="Report description")
    maintenance_work_order_id: str = Field(..., description="Associated maintenance work order ID")
    equipment_id: str = Field(..., description="Equipment ID")
    report_date: datetime = Field(..., description="Report date")
    maintenance_type: MaintenanceType = Field(..., description="Type of maintenance performed")
    technician_id: str = Field(..., description="Technician who performed the maintenance")
    work_summary: str = Field(..., description="Summary of work performed")
    parts_replaced: List[Dict[str, Any]] = Field(default_factory=list, description="Parts replaced")
    tools_used: List[str] = Field(default_factory=list, description="Tools used")
    issues_found: List[str] = Field(default_factory=list, description="Issues found during maintenance")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for future maintenance")
    next_maintenance_date: Optional[datetime] = Field(None, description="Next recommended maintenance date")
    cost_breakdown: Dict[str, float] = Field(default_factory=dict, description="Cost breakdown")
    total_cost: float = Field(0.0, description="Total maintenance cost")
    efficiency_improvement: Optional[float] = Field(None, description="Efficiency improvement percentage")
    safety_improvements: List[str] = Field(default_factory=list, description="Safety improvements made")
    compliance_notes: List[str] = Field(default_factory=list, description="Compliance notes")
    photos: List[str] = Field(default_factory=list, description="Photo URLs")
    documents: List[str] = Field(default_factory=list, description="Document URLs")
    approval_status: str = Field("pending", description="Approval status")
    approved_by_id: Optional[str] = Field(None, description="User who approved the report")

# Create Models
class MaintenanceScheduleCreate(MaintenanceScheduleBase):
    pass

class MaintenanceWorkOrderCreate(MaintenanceWorkOrderBase):
    pass

class EquipmentCreate(EquipmentBase):
    pass

class MaintenanceReportCreate(MaintenanceReportBase):
    pass

# Update Models
class MaintenanceScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    maintenance_type: Optional[MaintenanceType] = None
    priority: Optional[MaintenancePriority] = None
    category: Optional[MaintenanceCategory] = None
    equipment_id: Optional[str] = None
    location: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    estimated_duration_hours: Optional[float] = None
    assigned_technician_id: Optional[str] = None
    required_parts: Optional[List[str]] = None
    required_tools: Optional[List[str]] = None
    safety_requirements: Optional[List[str]] = None
    maintenance_procedures: Optional[List[str]] = None
    estimated_cost: Optional[float] = None
    tags: Optional[List[str]] = None

class MaintenanceWorkOrderUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[MaintenanceStatus] = None
    actual_duration_hours: Optional[float] = None
    work_performed: Optional[List[str]] = None
    parts_used: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[str]] = None
    issues_encountered: Optional[List[str]] = None
    solutions_applied: Optional[List[str]] = None
    quality_checks: Optional[List[Dict[str, Any]]] = None
    photos: Optional[List[str]] = None
    documents: Optional[List[str]] = None
    notes: Optional[str] = None
    approval_required: Optional[bool] = None
    approved_by_id: Optional[str] = None

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[MaintenanceCategory] = None
    location: Optional[str] = None
    status: Optional[EquipmentStatus] = None
    installation_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None
    maintenance_interval_hours: Optional[int] = None
    operating_hours: Optional[float] = None
    specifications: Optional[Dict[str, Any]] = None
    maintenance_history: Optional[List[str]] = None
    assigned_technicians: Optional[List[str]] = None
    critical_spare_parts: Optional[List[str]] = None
    operating_instructions: Optional[str] = None
    safety_guidelines: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class MaintenanceReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    report_date: Optional[datetime] = None
    work_summary: Optional[str] = None
    parts_replaced: Optional[List[Dict[str, Any]]] = None
    tools_used: Optional[List[str]] = None
    issues_found: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    next_maintenance_date: Optional[datetime] = None
    cost_breakdown: Optional[Dict[str, float]] = None
    total_cost: Optional[float] = None
    efficiency_improvement: Optional[float] = None
    safety_improvements: Optional[List[str]] = None
    compliance_notes: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    documents: Optional[List[str]] = None
    approval_status: Optional[str] = None
    approved_by_id: Optional[str] = None

# Response Models
class MaintenanceScheduleResponse(MaintenanceScheduleBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    created_by_id: str
    updated_by_id: Optional[str] = None

class MaintenanceWorkOrderResponse(MaintenanceWorkOrderBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    created_by_id: str
    updated_by_id: Optional[str] = None

class EquipmentResponse(EquipmentBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    created_by_id: str
    updated_by_id: Optional[str] = None

class MaintenanceReportResponse(MaintenanceReportBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    created_by_id: str
    updated_by_id: Optional[str] = None

# Dashboard and Filter Models
class MaintenanceDashboardStats(BaseModel):
    total_equipment: int
    operational_equipment: int
    maintenance_equipment: int
    overdue_maintenance: int
    scheduled_maintenance: int
    completed_maintenance: int
    total_cost: float
    efficiency_score: float
    uptime_percentage: float

class MaintenanceFilter(BaseModel):
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    type: Optional[MaintenanceType] = None
    category: Optional[MaintenanceCategory] = None
    equipment_id: Optional[str] = None
    assigned_technician_id: Optional[str] = None
    scheduled_date_from: Optional[datetime] = None
    scheduled_date_to: Optional[datetime] = None
    tags: Optional[List[str]] = None

class MaintenanceSearch(BaseModel):
    query: str
    filters: Optional[MaintenanceFilter] = None
