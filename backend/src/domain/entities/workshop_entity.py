import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base
from ...domain.enums.workshop_enums import WorkOrderStatus, WorkOrderPriority, WorkOrderType

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    work_order_number = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    work_order_type = Column(Enum(WorkOrderType), nullable=False, default=WorkOrderType.PRODUCTION)
    status = Column(Enum(WorkOrderStatus), nullable=False, default=WorkOrderStatus.DRAFT)
    priority = Column(Enum(WorkOrderPriority), nullable=False, default=WorkOrderPriority.MEDIUM)
    
    planned_start_date = Column(DateTime)
    planned_end_date = Column(DateTime)
    actual_start_date = Column(DateTime)
    actual_end_date = Column(DateTime)
    estimated_hours = Column(Float, default=0.0)
    actual_hours = Column(Float, default=0.0)
    
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    equipment_id = Column(UUID(as_uuid=True), nullable=True)
    location = Column(String)
    instructions = Column(Text)
    safety_notes = Column(Text)
    quality_requirements = Column(Text)
    
    materials_required = Column(JSON, default=[])
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    
    completion_percentage = Column(Float, default=0.0)
    current_step = Column(String)
    notes = Column(JSON, default=[])
    
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="work_orders")
    project = relationship("Project", back_populates="work_orders")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_work_orders")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_work_orders")
    approved_by = relationship("User", foreign_keys=[approved_by_id], back_populates="approved_work_orders")
    work_order_tasks = relationship("WorkOrderTask", back_populates="work_order", cascade="all, delete-orphan")
    production_plans = relationship("ProductionPlan", back_populates="work_order")
    quality_checks = relationship("QualityCheck", back_populates="work_order")
    quality_defects = relationship("QualityDefect", back_populates="work_order")
    
    __table_args__ = (
        Index("idx_work_orders_tenant_id", "tenant_id"),
        Index("idx_work_orders_status", "status"),
        Index("idx_work_orders_priority", "priority"),
        Index("idx_work_orders_type", "work_order_type"),
        Index("idx_work_orders_is_active", "is_active"),
        Index("idx_work_orders_assigned_to", "assigned_to_id"),
        Index("idx_work_orders_created_at", "created_at"),
        Index("idx_work_orders_tenant_status", "tenant_id", "status"),
        Index("idx_work_orders_tenant_active", "tenant_id", "is_active"),
    )

class WorkOrderTask(Base):
    __tablename__ = "work_order_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    work_order_id = Column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text)
    sequence_number = Column(Integer, default=0)
    estimated_hours = Column(Float, default=0.0)
    actual_hours = Column(Float, default=0.0)
    
    status = Column(String, default="pending")
    completion_percentage = Column(Float, default=0.0)
    
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    notes = Column(Text)
    attachments = Column(JSON, default=[])
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    work_order = relationship("WorkOrder", back_populates="work_order_tasks")
    tenant = relationship("Tenant")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])

