import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base
import enum

class ProductionStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProductionPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProductionType(str, enum.Enum):
    BATCH = "batch"
    CONTINUOUS = "continuous"
    JOB_SHOP = "job_shop"
    ASSEMBLY = "assembly"
    CUSTOM = "custom"

class ProductionPlan(Base):
    __tablename__ = "production_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    
    # Basic Information
    plan_number = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    production_type = Column(Enum(ProductionType), nullable=False, default=ProductionType.BATCH)
    status = Column(Enum(ProductionStatus), nullable=False, default=ProductionStatus.PLANNED)
    priority = Column(Enum(ProductionPriority), nullable=False, default=ProductionPriority.MEDIUM)
    
    # Planning & Scheduling
    planned_start_date = Column(DateTime)
    planned_end_date = Column(DateTime)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)
    estimated_duration_hours = Column(Float, default=0.0)
    actual_duration_hours = Column(Float, default=0.0)
    
    # Production Details
    target_quantity = Column(Integer, default=0)
    actual_quantity = Column(Integer, default=0)
    unit_of_measure = Column(String, default="pieces")
    production_line = Column(String)
    equipment_required = Column(JSON, default=[])
    
    # Materials & Resources
    materials_required = Column(JSON, default=[])
    labor_requirements = Column(JSON, default=[])
    estimated_material_cost = Column(Float, default=0.0)
    estimated_labor_cost = Column(Float, default=0.0)
    actual_material_cost = Column(Float, default=0.0)
    actual_labor_cost = Column(Float, default=0.0)
    
    # Quality & Standards
    quality_standards = Column(Text)
    inspection_points = Column(JSON, default=[])
    tolerance_specs = Column(JSON, default=[])
    
    # Assignment & Resources
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Progress Tracking
    completion_percentage = Column(Float, default=0.0)
    current_step = Column(String)
    notes = Column(JSON, default=[])
    
    # Metadata
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="production_plans")
    project = relationship("Project", back_populates="production_plans")
    work_order = relationship("WorkOrder", back_populates="production_plans")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_production_plans")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_production_plans")
    approved_by = relationship("User", foreign_keys=[approved_by_id], back_populates="approved_production_plans")
    production_steps = relationship("ProductionStep", back_populates="production_plan", cascade="all, delete-orphan")
    
    # Quality Control relationships
    quality_checks = relationship("QualityCheck", back_populates="production_plan")
    quality_defects = relationship("QualityDefect", back_populates="production_plan")

class ProductionStep(Base):
    __tablename__ = "production_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    production_plan_id = Column(UUID(as_uuid=True), ForeignKey("production_plans.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_name = Column(String, nullable=False)
    description = Column(Text)
    
    # Step Details
    estimated_duration_minutes = Column(Integer, default=0)
    actual_duration_minutes = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, in_progress, completed, skipped
    
    # Resources Required
    equipment_required = Column(JSON, default=[])
    materials_consumed = Column(JSON, default=[])
    labor_required = Column(JSON, default=[])
    
    # Quality Checkpoints
    quality_checkpoints = Column(JSON, default=[])
    inspection_required = Column(Boolean, default=False)
    
    # Dependencies
    depends_on_steps = Column(JSON, default=[])
    
    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    production_plan = relationship("ProductionPlan", back_populates="production_steps")

class ProductionSchedule(Base):
    __tablename__ = "production_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    production_plan_id = Column(UUID(as_uuid=True), ForeignKey("production_plans.id"), nullable=False)
    
    # Scheduling Details
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    resource_allocation = Column(JSON, default={})  # equipment, labor, materials
    capacity_utilization = Column(Float, default=0.0)
    
    # Constraints
    constraints = Column(JSON, default=[])  # maintenance windows, holidays, etc.
    dependencies = Column(JSON, default=[])  # other production plans this depends on
    
    # Status
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, delayed
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="production_schedules")
    production_plan = relationship("ProductionPlan")
