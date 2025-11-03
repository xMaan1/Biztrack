import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Boolean, Float, Integer, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from ...config.database_config import Base

class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    maintenance_type = Column(String(50), nullable=False)
    priority = Column(String(20), nullable=False, default="medium")
    category = Column(String(50), nullable=False)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    location = Column(String(255))
    scheduled_date = Column(DateTime, nullable=False)
    estimated_duration_hours = Column(Float, default=0.0)
    assigned_technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    required_parts = Column(JSON, default=list)
    required_tools = Column(JSON, default=list)
    safety_requirements = Column(JSON, default=list)
    maintenance_procedures = Column(JSON, default=list)
    estimated_cost = Column(Float, default=0.0)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant", back_populates="maintenance_schedules")
    equipment = relationship("Equipment", back_populates="maintenance_schedules")
    assigned_technician = relationship("User", foreign_keys=[assigned_technician_id], back_populates="assigned_maintenance_schedules")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_maintenance_schedules")
    updated_by = relationship("User", foreign_keys=[updated_by_id], back_populates="updated_maintenance_schedules")
    work_orders = relationship("MaintenanceWorkOrder", back_populates="maintenance_schedule")
    
    __table_args__ = (
        Index("idx_maintenance_schedules_tenant_id", "tenant_id"),
        Index("idx_maintenance_schedules_equipment_id", "equipment_id"),
        Index("idx_maintenance_schedules_status", "maintenance_type"),
        Index("idx_maintenance_schedules_priority", "priority"),
        Index("idx_maintenance_schedules_scheduled_date", "scheduled_date"),
        Index("idx_maintenance_schedules_assigned_technician", "assigned_technician_id"),
    )

class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    maintenance_schedule_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_schedules.id"), nullable=False)
    technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String(50), nullable=False, default="scheduled")
    actual_duration_hours = Column(Float)
    work_performed = Column(JSON, default=list)
    parts_used = Column(JSON, default=list)
    tools_used = Column(JSON, default=list)
    issues_encountered = Column(JSON, default=list)
    solutions_applied = Column(JSON, default=list)
    quality_checks = Column(JSON, default=list)
    photos = Column(JSON, default=list)
    documents = Column(JSON, default=list)
    notes = Column(Text)
    approval_required = Column(Boolean, default=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant", back_populates="maintenance_work_orders")
    maintenance_schedule = relationship("MaintenanceSchedule", back_populates="work_orders")
    technician = relationship("User", foreign_keys=[technician_id], back_populates="maintenance_technician_work_orders")
    approved_by = relationship("User", foreign_keys=[approved_by_id], back_populates="approved_maintenance_work_orders")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_maintenance_work_orders")
    updated_by = relationship("User", foreign_keys=[updated_by_id], back_populates="updated_maintenance_work_orders")
    maintenance_reports = relationship("MaintenanceReport", back_populates="work_order")
    
    __table_args__ = (
        Index("idx_maintenance_work_orders_tenant_id", "tenant_id"),
        Index("idx_maintenance_work_orders_schedule_id", "maintenance_schedule_id"),
        Index("idx_maintenance_work_orders_technician_id", "technician_id"),
        Index("idx_maintenance_work_orders_status", "status"),
        Index("idx_maintenance_work_orders_start_time", "start_time"),
    )

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    model = Column(String(255))
    serial_number = Column(String(255))
    manufacturer = Column(String(255))
    category = Column(String(50), nullable=False)
    location = Column(String(255))
    status = Column(String(50), nullable=False, default="operational")
    installation_date = Column(DateTime)
    warranty_expiry = Column(DateTime)
    last_maintenance_date = Column(DateTime)
    next_maintenance_date = Column(DateTime)
    maintenance_interval_hours = Column(Integer)
    operating_hours = Column(Float, default=0.0)
    specifications = Column(JSON, default=dict)
    maintenance_history = Column(JSON, default=list)
    assigned_technicians = Column(JSON, default=list)
    critical_spare_parts = Column(JSON, default=list)
    operating_instructions = Column(Text)
    safety_guidelines = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant", back_populates="equipment")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_equipment")
    updated_by = relationship("User", foreign_keys=[updated_by_id], back_populates="updated_equipment")
    maintenance_schedules = relationship("MaintenanceSchedule", back_populates="equipment")
    maintenance_reports = relationship("MaintenanceReport", back_populates="equipment")
    
    __table_args__ = (
        Index("idx_equipment_tenant_id", "tenant_id"),
        Index("idx_equipment_category", "category"),
        Index("idx_equipment_status", "status"),
        Index("idx_equipment_location", "location"),
        Index("idx_equipment_serial_number", "serial_number"),
        Index("idx_equipment_next_maintenance", "next_maintenance_date"),
    )

class MaintenanceReport(Base):
    __tablename__ = "maintenance_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    maintenance_work_order_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_work_orders.id"), nullable=False)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    report_date = Column(DateTime, nullable=False)
    maintenance_type = Column(String(50), nullable=False)
    technician_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    work_summary = Column(Text, nullable=False)
    parts_replaced = Column(JSON, default=list)
    tools_used = Column(JSON, default=list)
    issues_found = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    next_maintenance_date = Column(DateTime)
    cost_breakdown = Column(JSON, default=dict)
    total_cost = Column(Float, default=0.0)
    efficiency_improvement = Column(Float)
    safety_improvements = Column(JSON, default=list)
    compliance_notes = Column(JSON, default=list)
    photos = Column(JSON, default=list)
    documents = Column(JSON, default=list)
    approval_status = Column(String(50), default="pending")
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    tenant = relationship("Tenant", back_populates="maintenance_reports")
    work_order = relationship("MaintenanceWorkOrder", back_populates="maintenance_reports")
    equipment = relationship("Equipment", back_populates="maintenance_reports")
    technician = relationship("User", foreign_keys=[technician_id], back_populates="generated_maintenance_reports")
    approved_by = relationship("User", foreign_keys=[approved_by_id], back_populates="approved_maintenance_reports")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_maintenance_reports")
    updated_by = relationship("User", foreign_keys=[updated_by_id], back_populates="updated_maintenance_reports")
    
    __table_args__ = (
        Index("idx_maintenance_reports_tenant_id", "tenant_id"),
        Index("idx_maintenance_reports_work_order_id", "maintenance_work_order_id"),
        Index("idx_maintenance_reports_equipment_id", "equipment_id"),
        Index("idx_maintenance_reports_technician_id", "technician_id"),
        Index("idx_maintenance_reports_report_date", "report_date"),
        Index("idx_maintenance_reports_approval_status", "approval_status"),
    )

