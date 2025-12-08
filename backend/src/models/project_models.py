from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .common import (
    ProjectStatus,
    ProjectPriority,
    TaskStatus,
    TaskPriority,
    Pagination
)
from .user_models import TeamMember

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: int = 0
    budget: Optional[float] = None
    actualCost: float = 0.0
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: str
    teamMemberIds: List[str] = []
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return ProjectStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return ProjectPriority(v)
        return v
    
    @field_validator('description', 'notes', 'clientEmail', 'startDate', 'endDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v
    
    @field_validator('projectManagerId', mode='before')
    @classmethod
    def validate_project_manager_id(cls, v):
        if v == '' or v is None:
            raise ValueError('Project manager ID cannot be empty')
        return v
    
    @field_validator('teamMemberIds', mode='before')
    @classmethod
    def validate_team_member_ids(cls, v):
        if isinstance(v, list):
            filtered = [member_id for member_id in v if member_id is not None and member_id != '']
            return filtered
        return v

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: Optional[int] = None
    budget: Optional[float] = None
    actualCost: Optional[float] = None
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: Optional[str] = None
    teamMemberIds: Optional[List[str]] = None

    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return ProjectStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return ProjectPriority(v)
        return v
    
    @field_validator('description', 'notes', 'clientEmail', 'startDate', 'endDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v

class Project(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: int = 0
    budget: Optional[float] = None
    actualCost: float = 0.0
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: str
    projectManager: TeamMember
    teamMembers: List[TeamMember] = []
    createdAt: datetime
    updatedAt: datetime
    activities: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    projectId: str
    assignedToId: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: float = 0.0
    tags: List[str] = []
    parentTaskId: Optional[str] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return TaskStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return TaskPriority(v)
        return v
    
    @field_validator('description', 'dueDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v
    
    @field_validator('projectId', mode='before')
    @classmethod
    def validate_project_id(cls, v):
        if v == '' or v is None:
            raise ValueError('Project ID cannot be empty')
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignedToId: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    tags: Optional[List[str]] = None
    parentTaskId: Optional[str] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return TaskStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return TaskPriority(v)
        return v
    
    @field_validator('description', 'dueDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    project: str
    assignedTo: Optional[Dict[str, Any]] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: float = 0.0
    tags: List[str] = []
    createdBy: Dict[str, Any]
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SubTask(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    projectId: str
    assignedToId: Optional[str] = None
    createdById: str
    parentTaskId: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: float = 0.0
    tags: List[str] = []
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    assignedTo: Optional[Dict[str, Any]] = None
    createdBy: Dict[str, Any]
    subtasks: List['SubTask'] = []
    subtaskCount: int = 0
    completedSubtaskCount: int = 0

    class Config:
        from_attributes = True

SubTask.model_rebuild()

class WorkOrderBase(BaseModel):
    title: str
    description: Optional[str] = None
    work_order_type: str
    status: str
    priority: str
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    estimated_hours: Optional[float] = 0.0
    assigned_to_id: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    quality_requirements: Optional[str] = None
    materials_required: Optional[List[str]] = []
    estimated_cost: Optional[float] = 0.0
    tags: Optional[List[str]] = []

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    work_order_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    planned_start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    assigned_to_id: Optional[str] = None
    project_id: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    quality_requirements: Optional[str] = None
    materials_required: Optional[List[str]] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    completion_percentage: Optional[float] = None
    current_step: Optional[str] = None
    notes: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None

class WorkOrderResponse(WorkOrderBase):
    id: str
    work_order_number: str
    tenant_id: str
    created_by_id: str
    approved_by_id: Optional[str] = None
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    actual_hours: float
    completion_percentage: float
    current_step: Optional[str] = None
    notes: List[str]
    attachments: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectsResponse(BaseModel):
    projects: List[Project]
    pagination: Pagination

class TasksResponse(BaseModel):
    tasks: List[SubTask]
    pagination: Pagination

