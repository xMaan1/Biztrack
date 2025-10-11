import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base
from .core_models import project_team_members
import enum

class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.PLANNING)
    priority = Column(Enum(ProjectPriority), nullable=False, default=ProjectPriority.MEDIUM)
    startDate = Column(String)  # Store as string for compatibility
    endDate = Column(String)
    completionPercent = Column(Integer, default=0)
    budget = Column(Float)
    actualCost = Column(Float, default=0.0)
    projectManagerId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    clientEmail = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="projects")
    projectManager = relationship("User", foreign_keys=[projectManagerId], back_populates="managed_projects")
    teamMembers = relationship("User", secondary=project_team_members, back_populates="team_projects")
    tasks = relationship("Task", back_populates="project")
    work_orders = relationship("WorkOrder", back_populates="project")
    production_plans = relationship("ProductionPlan", back_populates="project")
    
    # Quality Control relationships
    quality_checks = relationship("QualityCheck", back_populates="project")
    quality_defects = relationship("QualityDefect", back_populates="project")
    
    # Indexes for performance optimization
    __table_args__ = (
        Index("idx_projects_tenant_id", "tenant_id"),
        Index("idx_projects_status", "status"),
        Index("idx_projects_priority", "priority"),
        Index("idx_projects_created_at", "createdAt"),
        Index("idx_projects_manager", "projectManagerId"),
        Index("idx_projects_tenant_status", "tenant_id", "status"),
    )

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    projectId = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parentTaskId = Column(UUID(as_uuid=True), ForeignKey("tasks.id"))  # For subtasks
    dueDate = Column(String)  # Store as string for compatibility
    estimatedHours = Column(Float)
    actualHours = Column(Float, default=0.0)
    tags = Column(Text)  # JSON string
    completedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignedTo = relationship("User", foreign_keys=[assignedToId], back_populates="assigned_tasks")
    createdBy = relationship("User", foreign_keys=[createdById], back_populates="created_tasks")
    parent_task = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks = relationship("Task", back_populates="parent_task")
