from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID
import uuid

# Common Models
class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    pages: int

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    TEAM_MEMBER = "team_member"
    CLIENT = "client"
    SALES_MANAGER = "sales_manager"
    SALES_REPRESENTATIVE = "sales_representative"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProjectPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# CRM Enums
class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class LeadSource(str, Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"
    EMAIL_CAMPAIGN = "email_campaign"
    COLD_CALL = "cold_call"
    TRADE_SHOW = "trade_show"
    PARTNER = "partner"
    OTHER = "other"

class OpportunityStage(str, Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

class ContactType(str, Enum):
    LEAD = "lead"
    CUSTOMER = "customer"
    PARTNER = "partner"
    VENDOR = "vendor"
    OTHER = "other"

class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    PROPOSAL = "proposal"
    CONTRACT = "contract"

class CompanySize(str, Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"

# Subscription and Billing Models
class PlanUpgradeRequest(BaseModel):
    tenant_id: str
    old_plan_id: Optional[str] = None
    new_plan_id: str

class UsageSummary(BaseModel):
    tenant_id: str
    plan_type: str
    subscription_status: str
    trial_ends: Optional[datetime] = None
    usage: Dict[str, Any]
    limits: Dict[str, Any]
    usage_percentages: Dict[str, float]
    last_updated: str

class PlanLimits(BaseModel):
    max_users: Optional[int] = None
    max_projects: Optional[int] = None
    max_storage_mb: Optional[int] = None
    features: List[str] = []

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"

class Industry(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    CONSULTING = "consulting"

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class ContractStatus(str, Enum):
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    OTHER = "other"

class PlanType(str, Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class PlanFeature(str, Enum):
    UNLIMITED_PROJECTS = "unlimited_projects"
    ADVANCED_REPORTING = "advanced_reporting"
    CUSTOM_INTEGRATIONS = "custom_integrations"
    PRIORITY_SUPPORT = "priority_support"
    CUSTOM_BRANDING = "custom_branding"
    API_ACCESS = "api_access"
    ADVANCED_PERMISSIONS = "advanced_permissions"
    AUDIT_LOGS = "audit_logs"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"

class TenantRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    VIEWER = "viewer"

class Permission(BaseModel):
    code: str  # e.g. 'manage_projects', 'view_reports'
    label: str  # Human-readable label

class CustomRoleBase(BaseModel):
    tenant_id: str
    name: str
    permissions: List[str]  # List of permission codes

class CustomRoleCreate(CustomRoleBase):
    pass

class CustomRoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None

class CustomRole(CustomRoleBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Base Models
class UserBase(BaseModel):
    userName: str
    email: EmailStr
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: UserRole = UserRole.TEAM_MEMBER
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: Optional[UserRole] = None
    avatar: Optional[str] = None

class User(UserBase):
    userId: str
    isActive: bool = True
    permissions: List[str] = []

    class Config:
        from_attributes = True

class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None

# Auth Models
class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class TenantInfo(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    role: str  # user's role in this tenant
    isActive: bool = True

class AuthResponse(BaseModel):
    success: bool
    user: User
    token: str
    refresh_token: str
    expires_in: int
    available_tenants: List[TenantInfo] = []
    requires_tenant_selection: bool = False

class TenantSelectionRequest(BaseModel):
    tenant_id: str

class TenantSelectionResponse(BaseModel):
    success: bool
    message: str
    tenant: TenantInfo
    access_token: str
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

# Project Models
class ProjectBase(BaseModel):
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

class ProjectCreate(ProjectBase):
    projectManagerId: str
    teamMemberIds: List[str] = []

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
    projectManagerId: Optional[str] = None
    teamMemberIds: Optional[List[str]] = None

class Project(ProjectBase):
    id: str
    projectManager: TeamMember
    teamMembers: List[TeamMember] = []
    createdAt: datetime
    updatedAt: datetime
    activities: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

# Task Models
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: float = 0.0
    tags: List[str] = []
    parentTaskId: Optional[str] = None  # For subtasks

class TaskCreate(TaskBase):
    project: str  # project ID
    assignedTo: Optional[str] = None  # user ID

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignedTo: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    tags: Optional[List[str]] = None
    parentTaskId: Optional[str] = None

class SubTask(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    assignedTo: Optional[Dict[str, str]] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: float = 0.0
    tags: List[str] = []
    createdBy: Dict[str, str]
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class Task(TaskBase):
    id: str
    project: str
    assignedTo: Optional[Dict[str, str]] = None
    createdBy: Dict[str, str]
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    subtasks: List[SubTask] = []
    subtaskCount: int = 0
    completedSubtaskCount: int = 0

    class Config:
        from_attributes = True

# Plan Models
class PlanBase(BaseModel):
    name: str
    description: str
    planType: PlanType
    price: float
    billingCycle: str  # monthly, yearly
    maxProjects: Optional[int] = None
    maxUsers: Optional[int] = None
    features: List[PlanFeature]
    isActive: bool = True

class Plan(PlanBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Work Order Models
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

# Tenant Models
class TenantBase(BaseModel):
    name: str
    domain: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}

class TenantCreate(TenantBase):
    planId: str
    ownerEmail: EmailStr

class Tenant(TenantBase):
    id: str
    isActive: bool = True
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Subscription Models
class SubscriptionBase(BaseModel):
    tenant_id: str
    planId: str
    status: SubscriptionStatus = SubscriptionStatus.TRIAL
    startDate: datetime
    endDate: Optional[datetime] = None
    autoRenew: bool = True

class SubscriptionCreate(SubscriptionBase):
    pass

class Subscription(SubscriptionBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    plan: Plan

    class Config:
        from_attributes = True

# Tenant User Models
class TenantUserBase(BaseModel):
    tenant_id: str
    userId: str
    role: TenantRole
    permissions: Optional[List[str]] = []
    isActive: bool = True

class TenantUserCreate(TenantUserBase):
    pass

class TenantUser(TenantUserBase):
    id: str
    invitedBy: Optional[str] = None
    joinedAt: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Response Models
class UsersResponse(BaseModel):
    users: List[User]

class ProjectsResponse(BaseModel):
    projects: List[Project]
    pagination: dict

class TasksResponse(BaseModel):
    tasks: List[Task]
    pagination: dict

class PlansResponse(BaseModel):
    plans: List[Plan]

class TenantsResponse(BaseModel):
    tenants: List[Tenant]
    pagination: dict

class TenantUsersResponse(BaseModel):
    users: List[TenantUser]
    pagination: dict

class SubscribeRequest(BaseModel):
    planId: str
    tenantName: str
    domain: Optional[str] = None

# Event-related enums and models
class EventType(str, Enum):
    MEETING = "meeting"
    WORKSHOP = "workshop"
    DEADLINE = "deadline"
    OTHER = "other"

class EventStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecurrenceType(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    eventType: EventType = EventType.MEETING
    startDate: datetime
    endDate: datetime
    timezone: str = "UTC"
    location: Optional[str] = None
    isOnline: bool = True
    googleMeetLink: Optional[str] = None
    googleCalendarEventId: Optional[str] = None
    recurrenceType: Optional[RecurrenceType] = None
    recurrenceData: Optional[Dict[str, Any]] = None
    reminderMinutes: int = 15
    participants: List[str] = []  # List of participant emails
    discussionPoints: List[str] = []
    attachments: List[str] = []
    projectId: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    eventType: Optional[EventType] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    timezone: Optional[str] = None
    location: Optional[str] = None
    isOnline: Optional[bool] = None
    googleMeetLink: Optional[str] = None
    googleCalendarEventId: Optional[str] = None
    recurrenceType: Optional[RecurrenceType] = None
    recurrenceData: Optional[Dict[str, Any]] = None
    reminderMinutes: Optional[int] = None
    participants: Optional[List[str]] = None
    discussionPoints: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    projectId: Optional[str] = None
    status: Optional[EventStatus] = None

class Event(EventBase):
    id: str
    status: EventStatus = EventStatus.SCHEDULED
    createdBy: str
    tenant_id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    events: List[Event]
    pagination: Optional[dict] = None

# Sales Module Enums and Models
class LeadBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: LeadSource = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW
    assignedTo: Optional[str] = None  # user ID
    notes: Optional[str] = None
    tags: List[str] = []
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None

class Lead(LeadBase):
    id: str
    tenant_id: str
    createdBy: str
    assignedToUser: Optional[Dict[str, str]] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Contact Models
class ContactBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    contactType: ContactType = ContactType.CUSTOMER
    isPrimary: bool = False
    notes: Optional[str] = None
    tags: List[str] = []

class ContactCreate(ContactBase):
    companyId: str

class ContactUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    contactType: Optional[ContactType] = None
    isPrimary: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class Contact(ContactBase):
    id: str
    companyId: str
    tenant_id: str
    createdBy: str
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Company Models
class CompanyBase(BaseModel):
    name: str
    industry: Optional[Industry] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    annualRevenue: Optional[float] = None
    employeeCount: Optional[int] = None
    description: Optional[str] = None
    tags: List[str] = []

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[Industry] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    annualRevenue: Optional[float] = None
    employeeCount: Optional[int] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class Company(CompanyBase):
    id: str
    tenant_id: str
    createdBy: str
    contacts: List[Contact] = []
    opportunities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Opportunity Models
class OpportunityBase(BaseModel):
    name: str
    description: Optional[str] = None
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: float
    probability: int = 50  # percentage
    expectedCloseDate: str
    leadSource: LeadSource = LeadSource.WEBSITE
    assignedTo: Optional[str] = None  # user ID
    notes: Optional[str] = None
    tags: List[str] = []

class OpportunityCreate(OpportunityBase):
    leadId: Optional[str] = None
    companyId: Optional[str] = None
    contactId: Optional[str] = None

class OpportunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[OpportunityStage] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    expectedCloseDate: Optional[str] = None
    leadSource: Optional[LeadSource] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class Opportunity(OpportunityBase):
    id: str
    leadId: Optional[str] = None
    companyId: Optional[str] = None
    contactId: Optional[str] = None
    tenant_id: str
    createdBy: str
    assignedToUser: Optional[Dict[str, str]] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Quote Models
class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unitPrice: float
    discount: float = 0.0
    total: float

class QuoteBase(BaseModel):
    title: str
    description: Optional[str] = None
    opportunityId: str
    validUntil: str
    terms: Optional[str] = None
    notes: Optional[str] = None
    items: List[QuoteItem] = []
    subtotal: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    total: float = 0.0

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    validUntil: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[QuoteItem]] = None
    subtotal: Optional[float] = None
    taxRate: Optional[float] = None
    taxAmount: Optional[float] = None
    total: Optional[float] = None

class Quote(QuoteBase):
    id: str
    quoteNumber: str
    status: QuoteStatus = QuoteStatus.DRAFT
    tenant_id: str
    createdBy: str
    sentAt: Optional[datetime] = None
    viewedAt: Optional[datetime] = None
    acceptedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Contract Models
class ContractBase(BaseModel):
    title: str
    description: Optional[str] = None
    opportunityId: str
    startDate: str
    endDate: str
    value: float
    terms: Optional[str] = None
    notes: Optional[str] = None
    autoRenew: bool = False
    renewalTerms: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    value: Optional[float] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    autoRenew: Optional[bool] = None
    renewalTerms: Optional[str] = None

class Contract(ContractBase):
    id: str
    contractNumber: str
    status: ContractStatus = ContractStatus.DRAFT
    tenant_id: str
    createdBy: str
    signedAt: Optional[datetime] = None
    activatedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Sales Activity Models
class SalesActivityBase(BaseModel):
    type: ActivityType
    subject: str
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = None

class SalesActivityCreate(SalesActivityBase):
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None

class SalesActivityUpdate(BaseModel):
    type: Optional[ActivityType] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class SalesActivity(SalesActivityBase):
    id: str
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    tenant_id: str
    createdBy: str
    assignedTo: Optional[str] = None
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Sales Response Models
class LeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: dict

class ContactsResponse(BaseModel):
    contacts: List[Contact]
    pagination: dict

class CompaniesResponse(BaseModel):
    companies: List[Company]
    pagination: dict

class OpportunitiesResponse(BaseModel):
    opportunities: List[Opportunity]
    pagination: dict

class QuotesResponse(BaseModel):
    quotes: List[Quote]
    pagination: dict

class ContractsResponse(BaseModel):
    contracts: List[Contract]
    pagination: dict

class SalesActivitiesResponse(BaseModel):
    activities: List[SalesActivity]
    pagination: dict

# Sales Dashboard Models
class SalesMetrics(BaseModel):
    totalLeads: int
    activeLeads: int
    totalOpportunities: int
    openOpportunities: int
    totalRevenue: float
    projectedRevenue: float
    conversionRate: float
    averageDealSize: float

class SalesPipeline(BaseModel):
    stage: str
    count: int
    value: float
    probability: float

class SalesDashboard(BaseModel):
    metrics: SalesMetrics
    pipeline: List[SalesPipeline]
    recentActivities: List[SalesActivity]
    topOpportunities: List[Opportunity]

# CRM Models
class LeadBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource = LeadSource.WEBSITE
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    score: int = 0
    budget: Optional[float] = None
    timeline: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    status: Optional[LeadStatus] = None
    source: Optional[LeadSource] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    score: Optional[int] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None

class Lead(LeadBase):
    id: str
    tenant_id: str
    createdBy: str
    convertedToContact: Optional[str] = None
    convertedToOpportunity: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    mobile: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    type: ContactType = ContactType.CUSTOMER
    notes: Optional[str] = None
    tags: List[str] = []
    isActive: bool = True

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    type: Optional[ContactType] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    isActive: Optional[bool] = None

class Contact(ContactBase):
    id: str
    tenant_id: str
    createdBy: str
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    isActive: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    isActive: Optional[bool] = None

class Company(CompanyBase):
    id: str
    tenant_id: str
    createdBy: str
    annualRevenue: Optional[float] = None
    employeeCount: Optional[int] = None
    foundedYear: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class OpportunityBase(BaseModel):
    title: str
    description: Optional[str] = None
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: Optional[float] = None
    probability: int = 50
    expectedCloseDate: Optional[str] = None
    leadId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[OpportunityStage] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    expectedCloseDate: Optional[str] = None
    leadId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class Opportunity(OpportunityBase):
    id: str
    tenant_id: str
    createdBy: str
    closedDate: Optional[datetime] = None
    wonAmount: Optional[float] = None
    lostReason: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SalesActivityBase(BaseModel):
    type: ActivityType
    subject: str
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = None

class SalesActivityCreate(SalesActivityBase):
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None

class SalesActivityUpdate(BaseModel):
    type: Optional[ActivityType] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class SalesActivity(SalesActivityBase):
    id: str
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    tenant_id: str
    createdBy: str
    assignedTo: Optional[str] = None
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# CRM Response Models
class CRMLeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: dict

class CRMContactsResponse(BaseModel):
    contacts: List[Contact]
    pagination: dict

class CRMCompaniesResponse(BaseModel):
    companies: List[Company]
    pagination: dict

class CRMOpportunitiesResponse(BaseModel):
    opportunities: List[Opportunity]
    pagination: dict

class CRMActivitiesResponse(BaseModel):
    activities: List[SalesActivity]
    pagination: dict

# CRM Dashboard Models
class CRMMetrics(BaseModel):
    totalLeads: int
    activeLeads: int
    totalContacts: int
    totalCompanies: int
    totalOpportunities: int
    openOpportunities: int
    totalRevenue: float
    projectedRevenue: float
    conversionRate: float
    averageDealSize: float

class CRMPipeline(BaseModel):
    stage: str
    count: int
    value: float
    probability: float

class CRMDashboard(BaseModel):
    metrics: CRMMetrics
    pipeline: List[CRMPipeline]
    recentActivities: List[SalesActivity]
    topOpportunities: List[Opportunity]
    recentLeads: List[Lead]

# HRM Enums
class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    RESIGNED = "resigned"
    RETIRED = "retired"
    PROBATION = "probation"

class EmployeeType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACTOR = "contractor"
    INTERN = "intern"
    FREELANCER = "freelancer"

class Department(str, Enum):
    ENGINEERING = "engineering"
    SALES = "sales"
    MARKETING = "marketing"
    HR = "hr"
    FINANCE = "finance"
    OPERATIONS = "operations"
    CUSTOMER_SUPPORT = "customer_support"
    LEGAL = "legal"
    IT = "it"
    OTHER = "other"

class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    ON_HOLD = "on_hold"

class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    TECHNICAL_TEST = "technical_test"
    REFERENCE_CHECK = "reference_check"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

class ReviewType(str, Enum):
    ANNUAL = "annual"
    QUARTERLY = "quarterly"
    MONTHLY = "monthly"
    PROJECT_BASED = "project_based"
    PROBATION = "probation"

class ReviewStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"

class LeaveType(str, Enum):
    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"
    UNPAID = "unpaid"
    OTHER = "other"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class PayrollStatus(str, Enum):
    DRAFT = "draft"
    PROCESSED = "processed"
    PAID = "paid"
    CANCELLED = "cancelled"

class TrainingStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"

class TrainingType(str, Enum):
    ONBOARDING = "onboarding"
    SKILL_DEVELOPMENT = "skill_development"
    COMPLIANCE = "compliance"
    LEADERSHIP = "leadership"
    TECHNICAL = "technical"
    SOFT_SKILLS = "soft_skills"
    CERTIFICATION = "certification"

# HRM Models
class EmployeeBase(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    hireDate: str
    employeeId: str
    department: Department
    position: str
    employeeType: EmployeeType
    employmentStatus: EmploymentStatus
    managerId: Optional[str] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    skills: List[str] = []
    certifications: List[str] = []
    notes: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    hireDate: Optional[str] = None
    employeeId: Optional[str] = None
    department: Optional[Department] = None
    position: Optional[str] = None
    employeeType: Optional[EmployeeType] = None
    employmentStatus: Optional[EmploymentStatus] = None
    managerId: Optional[str] = None
    salary: Optional[float] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    notes: Optional[str] = None

class Employee(EmployeeBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class JobPostingBase(BaseModel):
    title: str
    department: Department
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    location: str
    type: EmployeeType
    salaryRange: Optional[str] = None
    benefits: List[str] = []
    status: JobStatus
    openDate: str
    closeDate: Optional[str] = None
    hiringManagerId: Optional[str] = None
    tags: List[str] = []

class JobPostingCreate(JobPostingBase):
    pass

class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[Department] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    location: Optional[str] = None
    type: Optional[EmployeeType] = None
    salaryRange: Optional[str] = None
    benefits: Optional[List[str]] = None
    status: Optional[JobStatus] = None
    openDate: Optional[str] = None
    closeDate: Optional[str] = None
    hiringManagerId: Optional[str] = None
    tags: Optional[List[str]] = None

class JobPosting(JobPostingBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class ApplicationBase(BaseModel):
    jobPostingId: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    resume: Optional[str] = None
    coverLetter: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: List[str] = []
    status: ApplicationStatus
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    interviewDate: Optional[str] = None
    interviewNotes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    resume: Optional[str] = None
    coverLetter: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[ApplicationStatus] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    interviewDate: Optional[str] = None
    interviewNotes: Optional[str] = None

class Application(ApplicationBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class PerformanceReviewBase(BaseModel):
    employeeId: str
    reviewerId: str
    reviewType: ReviewType
    reviewPeriod: str
    reviewDate: str
    status: ReviewStatus
    goals: List[str] = []
    achievements: List[str] = []
    areasOfImprovement: List[str] = []
    overallRating: Optional[int] = None
    technicalRating: Optional[int] = None
    communicationRating: Optional[int] = None
    teamworkRating: Optional[int] = None
    leadershipRating: Optional[int] = None
    comments: Optional[str] = None
    nextReviewDate: Optional[str] = None

class PerformanceReviewCreate(PerformanceReviewBase):
    pass

class PerformanceReviewUpdate(BaseModel):
    reviewerId: Optional[str] = None
    reviewType: Optional[ReviewType] = None
    reviewPeriod: Optional[str] = None
    reviewDate: Optional[str] = None
    status: Optional[ReviewStatus] = None
    goals: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    areasOfImprovement: Optional[List[str]] = None
    overallRating: Optional[int] = None
    technicalRating: Optional[int] = None
    communicationRating: Optional[int] = None
    teamworkRating: Optional[int] = None
    leadershipRating: Optional[int] = None
    comments: Optional[str] = None
    nextReviewDate: Optional[str] = None

class PerformanceReview(PerformanceReviewBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class TimeEntryBase(BaseModel):
    employeeId: str
    date: str
    clockIn: str
    clockOut: Optional[str] = None
    totalHours: Optional[float] = None
    overtimeHours: Optional[float] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryUpdate(BaseModel):
    clockIn: Optional[str] = None
    clockOut: Optional[str] = None
    totalHours: Optional[float] = None
    overtimeHours: Optional[float] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class TimeEntry(TimeEntryBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class LeaveRequestBase(BaseModel):
    employeeId: str
    leaveType: LeaveType
    startDate: str
    endDate: str
    totalDays: float
    reason: str
    status: LeaveStatus
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    rejectionReason: Optional[str] = None
    notes: Optional[str] = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    leaveType: Optional[LeaveType] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    totalDays: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[LeaveStatus] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    rejectionReason: Optional[str] = None
    notes: Optional[str] = None

class LeaveRequest(LeaveRequestBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class PayrollBase(BaseModel):
    employeeId: str
    payPeriod: str
    startDate: str
    endDate: str
    basicSalary: float
    allowances: float = 0
    deductions: float = 0
    overtimePay: float = 0
    bonus: float = 0
    netPay: float
    status: PayrollStatus
    paymentDate: Optional[str] = None
    notes: Optional[str] = None

class PayrollCreate(PayrollBase):
    pass

class PayrollUpdate(BaseModel):
    basicSalary: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    overtimePay: Optional[float] = None
    bonus: Optional[float] = None
    netPay: Optional[float] = None
    status: Optional[PayrollStatus] = None
    paymentDate: Optional[str] = None
    notes: Optional[str] = None

class Payroll(PayrollBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class BenefitsBase(BaseModel):
    employeeId: str
    benefitType: str
    provider: str
    policyNumber: Optional[str] = None
    startDate: str
    endDate: Optional[str] = None
    monthlyCost: float
    employeeContribution: float
    employerContribution: float
    status: str = "active"
    notes: Optional[str] = None

class BenefitsCreate(BenefitsBase):
    pass

class BenefitsUpdate(BaseModel):
    benefitType: Optional[str] = None
    provider: Optional[str] = None
    policyNumber: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    monthlyCost: Optional[float] = None
    employeeContribution: Optional[float] = None
    employerContribution: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Benefits(BenefitsBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class TrainingBase(BaseModel):
    title: str
    description: str
    trainingType: TrainingType
    duration: str
    cost: float
    provider: str
    startDate: str
    endDate: str
    maxParticipants: Optional[int] = None
    status: TrainingStatus
    materials: List[str] = []
    objectives: List[str] = []
    prerequisites: List[str] = []

class TrainingCreate(TrainingBase):
    pass

class TrainingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    trainingType: Optional[TrainingType] = None
    duration: Optional[str] = None
    cost: Optional[float] = None
    provider: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    maxParticipants: Optional[int] = None
    status: Optional[TrainingStatus] = None
    materials: Optional[List[str]] = None
    objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None

class Training(TrainingBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

class TrainingEnrollmentBase(BaseModel):
    trainingId: str
    employeeId: str
    enrollmentDate: str
    completionDate: Optional[str] = None
    status: TrainingStatus
    score: Optional[int] = None
    certificate: Optional[str] = None
    feedback: Optional[str] = None

class TrainingEnrollmentCreate(TrainingEnrollmentBase):
    pass

class TrainingEnrollmentUpdate(BaseModel):
    completionDate: Optional[str] = None
    status: Optional[TrainingStatus] = None
    score: Optional[int] = None
    certificate: Optional[str] = None
    feedback: Optional[str] = None

class TrainingEnrollment(TrainingEnrollmentBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: str
    updatedAt: str

# HRM Response Models
class HRMEmployeesResponse(BaseModel):
    employees: List[Employee]
    pagination: Pagination

class HRMJobPostingsResponse(BaseModel):
    jobPostings: List[JobPosting]
    pagination: Pagination

class HRMApplicationsResponse(BaseModel):
    applications: List[Application]
    pagination: Pagination

class HRMReviewsResponse(BaseModel):
    reviews: List[PerformanceReview]
    pagination: Pagination

class HRMTimeEntriesResponse(BaseModel):
    timeEntries: List[TimeEntry]
    pagination: Pagination

class HRMLeaveRequestsResponse(BaseModel):
    leaveRequests: List[LeaveRequest]
    pagination: Pagination

class HRMPayrollResponse(BaseModel):
    payroll: List[Payroll]
    pagination: Pagination

class HRMBenefitsResponse(BaseModel):
    benefits: List[Benefits]
    pagination: Pagination

class HRMTrainingResponse(BaseModel):
    training: List[Training]
    pagination: Pagination

class HRMEnrollmentsResponse(BaseModel):
    enrollments: List[TrainingEnrollment]
    pagination: Pagination

# HRM Dashboard Models
class HRMMetrics(BaseModel):
    totalEmployees: int
    activeEmployees: int
    newHires: int
    turnoverRate: float
    averageSalary: float
    openPositions: int
    pendingApplications: int
    upcomingReviews: int
    pendingLeaveRequests: int
    trainingCompletionRate: float

class HRMDashboard(BaseModel):
    metrics: HRMMetrics
    recentHires: List[Employee]
    upcomingReviews: List[PerformanceReview]
    pendingLeaveRequests: List[LeaveRequest]
    openJobPostings: List[JobPosting]
    recentApplications: List[Application]
    departmentDistribution: Dict[str, int]
    trainingPrograms: List[Training]

# HRM Filter Models
class HRMEmployeeFilters(BaseModel):
    department: Optional[str] = None
    status: Optional[str] = None
    employeeType: Optional[str] = None
    search: Optional[str] = None

class HRMJobFilters(BaseModel):
    department: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    search: Optional[str] = None

class HRMApplicationFilters(BaseModel):
    status: Optional[str] = None
    jobPostingId: Optional[str] = None
    assignedTo: Optional[str] = None
    search: Optional[str] = None

class HRMReviewFilters(BaseModel):
    employeeId: Optional[str] = None
    reviewType: Optional[str] = None
    status: Optional[str] = None
    reviewPeriod: Optional[str] = None

class HRMTimeFilters(BaseModel):
    employeeId: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    projectId: Optional[str] = None

class HRMLeaveFilters(BaseModel):
    employeeId: Optional[str] = None
    leaveType: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class HRMPayrollFilters(BaseModel):
    employeeId: Optional[str] = None
    payPeriod: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class HRMTrainingFilters(BaseModel):
    trainingType: Optional[str] = None
    status: Optional[str] = None
    provider: Optional[str] = None
    search: Optional[str] = None

# Custom Tenant-Specific Options Models
class CustomEventType(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomDepartment(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomLeaveType(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomLeadSource(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomContactSource(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomCompanyIndustry(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomContactType(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomIndustry(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

# Invoice Enums
class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    VOID = "void"

class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class InvoiceItem(BaseModel):
    id: UUID
    description: str
    quantity: float
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    total: float
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None

class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None

class InvoiceItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None
    discount: Optional[float] = None
    taxRate: Optional[float] = None
    productId: Optional[str] = None
    projectId: Optional[str] = None
    taskId: Optional[str] = None

# Invoice Models
class InvoiceBase(BaseModel):
    invoiceNumber: str
    customerId: str
    customerName: str
    customerEmail: str
    customerPhone: Optional[str] = None  # New field for customer phone
    billingAddress: str
    shippingAddress: Optional[str] = None
    issueDate: datetime
    dueDate: datetime
    orderNumber: Optional[str] = None  # New field for order number
    orderTime: Optional[datetime] = None  # New field for order time
    paymentTerms: str = "Net 30"
    currency: str = "USD"
    subtotal: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT
    items: List[InvoiceItem] = []

class InvoiceCreate(BaseModel):
    customerId: str
    customerName: str
    customerEmail: str
    customerPhone: Optional[str] = None  # New field for customer phone
    billingAddress: str
    shippingAddress: Optional[str] = None
    issueDate: str
    dueDate: str
    orderNumber: Optional[str] = None  # New field for order number
    orderTime: Optional[str] = None  # New field for order time
    paymentTerms: str = "Net 30"
    currency: str = "USD"
    taxRate: float = 0.0
    discount: float = 0.0
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: List[InvoiceItemCreate] = []
    opportunityId: Optional[str] = None
    quoteId: Optional[str] = None
    projectId: Optional[str] = None
    
    # Vehicle details for workshop invoices
    vehicleMake: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleYear: Optional[str] = None
    vehicleColor: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleMileage: Optional[str] = None
    
    # Workshop specific fields
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = 0.0
    partsTotal: Optional[float] = 0.0

class InvoiceUpdate(BaseModel):
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    billingAddress: Optional[str] = None
    shippingAddress: Optional[str] = None
    issueDate: Optional[str] = None
    dueDate: Optional[str] = None
    orderNumber: Optional[str] = None
    orderTime: Optional[str] = None
    paymentTerms: Optional[str] = None
    currency: Optional[str] = None
    taxRate: Optional[float] = None
    discount: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    items: Optional[List[InvoiceItemCreate]] = None
    
    # Vehicle details for workshop invoices
    vehicleMake: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleYear: Optional[str] = None
    vehicleColor: Optional[str] = None
    vehicleVin: Optional[str] = None
    vehicleReg: Optional[str] = None
    vehicleMileage: Optional[str] = None
    
    # Workshop specific fields
    jobDescription: Optional[str] = None
    partsDescription: Optional[str] = None
    labourTotal: Optional[float] = None
    partsTotal: Optional[float] = None

class Invoice(InvoiceBase):
    id: UUID
    tenant_id: UUID
    createdBy: UUID
    opportunityId: Optional[str] = None
    quoteId: Optional[str] = None
    projectId: Optional[str] = None
    sentAt: Optional[datetime] = None
    viewedAt: Optional[datetime] = None
    paidAt: Optional[datetime] = None
    overdueAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    payments: List[Dict[str, Any]] = []
    totalPaid: float = 0.0
    balance: float = 0.0
    daysOverdue: int = 0

    class Config:
        from_attributes = True

# Invoice Customization Models
class InvoiceCustomizationBase(BaseModel):
    company_name: str
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    payment_instructions: Optional[str] = None
    primary_color: str = "#1e40af"
    secondary_color: str = "#6b7280"
    accent_color: str = "#f3f4f6"
    show_vehicle_info: bool = True
    show_parts_section: bool = True
    show_labour_section: bool = True
    show_comments_section: bool = True
    footer_text: Optional[str] = None
    show_contact_info_in_footer: bool = True
    custom_fields: Optional[Dict[str, Any]] = {}

class InvoiceCustomizationCreate(InvoiceCustomizationBase):
    pass

class InvoiceCustomizationUpdate(BaseModel):
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    payment_instructions: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    show_vehicle_info: Optional[bool] = None
    show_parts_section: Optional[bool] = None
    show_labour_section: Optional[bool] = None
    show_comments_section: Optional[bool] = None
    footer_text: Optional[str] = None
    show_contact_info_in_footer: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None

class InvoiceCustomization(InvoiceCustomizationBase):
    id: UUID
    tenant_id: UUID
    created_by: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceCustomizationResponse(BaseModel):
    customization: InvoiceCustomization
        
    @classmethod
    def from_orm(cls, obj):
        # Convert JSON items to InvoiceItem objects for validation
        if hasattr(obj, 'items') and obj.items:
            # Ensure items have required fields
            validated_items = []
            for item in obj.items:
                if isinstance(item, dict):
                    # Calculate missing fields if they don't exist
                    quantity = item.get('quantity', 0.0)
                    unit_price = item.get('unitPrice', 0.0)
                    discount = item.get('discount', 0.0)
                    tax_rate = item.get('taxRate', 0.0)
                    
                    # Calculate item total if missing
                    item_subtotal = quantity * unit_price
                    item_discount_amount = item_subtotal * (discount / 100) if discount > 0 else 0
                    item_tax_amount = (item_subtotal - item_discount_amount) * (tax_rate / 100) if tax_rate > 0 else 0
                    item_total = item_subtotal - item_discount_amount + item_tax_amount
                    
                    # Ensure required fields exist
                    validated_item = InvoiceItem(
                        id=item.get('id', str(uuid.uuid4())),
                        description=item.get('description', ''),
                        quantity=quantity,
                        unitPrice=unit_price,
                        discount=discount,
                        taxRate=tax_rate,
                        taxAmount=item.get('taxAmount', round(item_tax_amount, 2)),
                        total=item.get('total', round(item_total, 2)),
                        productId=item.get('productId'),
                        projectId=item.get('projectId'),
                        taskId=item.get('taskId')
                    )
                    validated_items.append(validated_item)
                else:
                    validated_items.append(item)
            obj.items = validated_items
        return super().from_orm(obj)

# Payment Models
class PaymentBase(BaseModel):
    invoiceId: str
    amount: float
    paymentMethod: PaymentMethod
    paymentDate: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING

class PaymentCreate(BaseModel):
    invoiceId: str
    amount: float
    paymentMethod: PaymentMethod
    paymentDate: str
    reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    paymentMethod: Optional[PaymentMethod] = None
    paymentDate: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PaymentStatus] = None

class Payment(PaymentBase):
    id: UUID
    tenant_id: UUID
    createdBy: UUID
    processedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Invoice Response Models
class InvoicesResponse(BaseModel):
    invoices: List[Invoice]
    pagination: dict

class InvoiceResponse(BaseModel):
    invoice: Invoice

class PaymentsResponse(BaseModel):
    payments: List[Payment]
    pagination: dict

class PaymentResponse(BaseModel):
    payment: Payment

# Invoice Dashboard Models
class InvoiceMetrics(BaseModel):
    totalInvoices: int
    paidInvoices: int
    overdueInvoices: int
    draftInvoices: int
    totalRevenue: float
    outstandingAmount: float
    overdueAmount: float
    averagePaymentTime: float

class InvoiceDashboard(BaseModel):
    metrics: InvoiceMetrics
    recentInvoices: List[Invoice]
    overdueInvoices: List[Invoice]
    topCustomers: List[Dict[str, Any]]
    monthlyRevenue: List[Dict[str, Any]]

# Invoice Filter Models
class InvoiceFilters(BaseModel):
    status: Optional[str] = None
    customerId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    amountFrom: Optional[float] = None
    amountTo: Optional[float] = None
    search: Optional[str] = None

class PaymentFilters(BaseModel):
    invoiceId: Optional[str] = None
    paymentMethod: Optional[str] = None
    status: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    search: Optional[str] = None

# POS Enums
class POSPaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE = "mobile"
    BANK_TRANSFER = "bank_transfer"

class POSTransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    VOID = "void"

class POSShiftStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    FOOD = "food"
    BEVERAGES = "beverages"
    HEALTHCARE = "healthcare"
    PHARMACEUTICALS = "pharmaceuticals"
    OFFICE_SUPPLIES = "office_supplies"
    AUTOMOTIVE = "automotive"
    CONSTRUCTION = "construction"
    CHEMICALS = "chemicals"
    TEXTILES = "textiles"
    FURNITURE = "furniture"
    TOOLS = "tools"
    OTHER = "other"

class UnitOfMeasure(str, Enum):
    PIECE = "piece"
    KILOGRAM = "kg"
    GRAM = "g"
    LITER = "l"
    MILLILITER = "ml"
    METER = "m"
    CENTIMETER = "cm"
    SQUARE_METER = "m²"
    CUBIC_METER = "m³"
    BOX = "box"
    PACK = "pack"
    ROLL = "roll"
    SET = "set"
    PAIR = "pair"
    DOZEN = "dozen"
    OTHER = "other"

class StockMovementType(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    RETURN = "return"
    DAMAGE = "damage"
    EXPIRY = "expiry"
    CYCLE_COUNT = "cycle_count"

class StockMovementStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    ORDERED = "ordered"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class ReceivingStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"

# Product Models
class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category: ProductCategory
    unitPrice: float
    costPrice: float
    stockQuantity: int
    minStockLevel: int = 0
    maxStockLevel: Optional[int] = None
    unitOfMeasure: UnitOfMeasure = UnitOfMeasure.PIECE
    barcode: Optional[str] = None
    expiryDate: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    isActive: bool = True
    imageUrl: Optional[str] = None
    # Enhanced inventory fields
    weight: Optional[float] = None
    dimensions: Optional[str] = None  # "LxWxH in cm"
    supplierId: Optional[str] = None
    supplierName: Optional[str] = None
    leadTime: Optional[int] = None  # days
    reorderPoint: Optional[int] = None
    reorderQuantity: Optional[int] = None
    isSerialized: bool = False
    isBatchTracked: bool = False
    storageLocation: Optional[str] = None
    warehouseId: Optional[str] = None
    lastStockCount: Optional[datetime] = None
    lastStockMovement: Optional[datetime] = None

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category: ProductCategory
    unitPrice: float
    costPrice: float
    stockQuantity: int
    minStockLevel: int = 0
    maxStockLevel: Optional[int] = None
    unitOfMeasure: str = "piece"
    barcode: Optional[str] = None
    expiryDate: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    isActive: bool = True
    imageUrl: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    unitPrice: Optional[float] = None
    costPrice: Optional[float] = None
    stockQuantity: Optional[int] = None
    minStockLevel: Optional[int] = None
    maxStockLevel: Optional[int] = None
    unitOfMeasure: Optional[str] = None
    barcode: Optional[str] = None
    expiryDate: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    isActive: Optional[bool] = None
    imageUrl: Optional[str] = None

class Product(ProductBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Warehouse Models
class WarehouseBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    country: str
    postalCode: str
    phone: Optional[str] = None
    email: Optional[str] = None
    managerId: Optional[str] = None
    isActive: bool = True
    capacity: Optional[float] = None  # in cubic meters
    usedCapacity: Optional[float] = None
    temperatureZone: Optional[str] = None
    securityLevel: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    managerId: Optional[str] = None
    isActive: Optional[bool] = None
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    temperatureZone: Optional[str] = None
    securityLevel: Optional[str] = None

class Warehouse(WarehouseBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Storage Location Models
class StorageLocationBase(BaseModel):
    warehouseId: str
    name: str
    code: str
    description: Optional[str] = None
    locationType: str  # shelf, rack, bin, area, etc.
    parentLocationId: Optional[str] = None
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    isActive: bool = True

class StorageLocationCreate(StorageLocationBase):
    pass

class StorageLocationUpdate(BaseModel):
    warehouseId: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    locationType: Optional[str] = None
    parentLocationId: Optional[str] = None
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    isActive: Optional[bool] = None

class StorageLocation(StorageLocationBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Stock Movement Models
class StockMovementBase(BaseModel):
    productId: str
    warehouseId: str
    locationId: Optional[str] = None
    movementType: StockMovementType
    quantity: int
    unitCost: float
    referenceNumber: Optional[str] = None
    referenceType: Optional[str] = None  # PO, SO, Transfer, etc.
    notes: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementUpdate(BaseModel):
    productId: Optional[str] = None
    warehouseId: Optional[str] = None
    locationId: Optional[str] = None
    movementType: Optional[StockMovementType] = None
    quantity: Optional[int] = None
    unitCost: Optional[float] = None
    referenceNumber: Optional[str] = None
    referenceType: Optional[str] = None
    notes: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None

class StockMovement(StockMovementBase):
    id: str
    tenant_id: str
    createdBy: str
    status: StockMovementStatus
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Purchase Order Models
class PurchaseOrderItemBase(BaseModel):
    productId: str
    productName: str
    sku: str
    quantity: int
    unitCost: float
    totalCost: float
    receivedQuantity: int = 0
    notes: Optional[str] = None

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemUpdate(BaseModel):
    productId: Optional[str] = None
    productName: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    unitCost: Optional[float] = None
    totalCost: Optional[float] = None
    receivedQuantity: Optional[int] = None
    notes: Optional[str] = None

class PurchaseOrderItem(PurchaseOrderItemBase):
    id: str
    purchaseOrderId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    orderNumber: str
    supplierId: str
    supplierName: str
    expectedDeliveryDate: str
    status: PurchaseOrderStatus
    totalAmount: float
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderCreate(BaseModel):
    orderNumber: str
    supplierId: str
    supplierName: str
    expectedDeliveryDate: str
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    orderNumber: Optional[str] = None
    supplierId: Optional[str] = None
    supplierName: Optional[str] = None
    expectedDeliveryDate: Optional[str] = None
    status: Optional[PurchaseOrderStatus] = None
    totalAmount: Optional[float] = None
    notes: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Supplier Models
class SupplierBase(BaseModel):
    name: str
    code: str
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    website: Optional[str] = None
    paymentTerms: Optional[str] = None
    creditLimit: Optional[float] = None
    isActive: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contactPerson: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    website: Optional[str] = None
    paymentTerms: Optional[str] = None
    creditLimit: Optional[float] = None
    isActive: Optional[bool] = None

class Supplier(SupplierBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Receiving Models
class ReceivingItemBase(BaseModel):
    purchaseOrderId: str
    productId: str
    productName: str
    sku: str
    quantity: int
    unitCost: float
    totalCost: float
    receivedQuantity: int
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None
    notes: Optional[str] = None

class ReceivingItemCreate(ReceivingItemBase):
    pass

class ReceivingItemUpdate(BaseModel):
    purchaseOrderId: Optional[str] = None
    productId: Optional[str] = None
    productName: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    unitCost: Optional[float] = None
    totalCost: Optional[float] = None
    receivedQuantity: Optional[int] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None
    notes: Optional[str] = None

class ReceivingItem(ReceivingItemBase):
    id: str
    receivingId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ReceivingBase(BaseModel):
    receivingNumber: str
    purchaseOrderId: str
    warehouseId: str
    status: ReceivingStatus
    receivedDate: str
    notes: Optional[str] = None
    items: List[ReceivingItemCreate]

class ReceivingCreate(BaseModel):
    receivingNumber: str
    purchaseOrderId: str
    warehouseId: str
    receivedDate: str
    notes: Optional[str] = None
    items: List[ReceivingItemCreate]

class ReceivingUpdate(BaseModel):
    receivingNumber: Optional[str] = None
    purchaseOrderId: Optional[str] = None
    warehouseId: Optional[str] = None
    status: Optional[ReceivingStatus] = None
    receivedDate: Optional[str] = None
    notes: Optional[str] = None

class Receiving(ReceivingBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# POS Transaction Models
class POSTransactionItem(BaseModel):
    productId: str
    productName: str
    sku: str
    quantity: int
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    total: float

class POSTransactionBase(BaseModel):
    transactionNumber: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[POSTransactionItem]
    subtotal: float
    discount: float = 0.0
    taxAmount: float = 0.0
    total: float
    paymentMethod: POSPaymentMethod
    cashAmount: float = 0.0
    changeAmount: float = 0.0
    notes: Optional[str] = None
    status: POSTransactionStatus = POSTransactionStatus.PENDING

class POSTransactionCreate(BaseModel):
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[POSTransactionItem]
    discount: float = 0.0
    taxRate: float = 0.0
    paymentMethod: POSPaymentMethod
    cashAmount: float = 0.0
    notes: Optional[str] = None

class POSTransactionUpdate(BaseModel):
    status: Optional[POSTransactionStatus] = None
    notes: Optional[str] = None

class POSTransaction(POSTransactionBase):
    id: str
    tenant_id: str
    shiftId: str
    cashierId: str
    cashierName: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# POS Shift Models
class POSShiftBase(BaseModel):
    shiftNumber: str
    openingBalance: float
    closingBalance: Optional[float] = None
    totalSales: float = 0.0
    totalTransactions: int = 0
    status: POSShiftStatus = POSShiftStatus.OPEN
    notes: Optional[str] = None

class POSShiftCreate(BaseModel):
    openingBalance: float
    notes: Optional[str] = None

class POSShiftUpdate(BaseModel):
    closingBalance: Optional[float] = None
    status: Optional[POSShiftStatus] = None
    notes: Optional[str] = None

class POSShift(POSShiftBase):
    id: str
    tenant_id: str
    cashierId: str
    cashierName: str
    openedAt: datetime
    closedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# POS Response Models
class ProductsResponse(BaseModel):
    products: List[Product]
    pagination: dict

class ProductResponse(BaseModel):
    product: Product

class POSTransactionsResponse(BaseModel):
    transactions: List[POSTransaction]
    pagination: dict

class POSTransactionResponse(BaseModel):
    transaction: POSTransaction

class POSShiftsResponse(BaseModel):
    shifts: List[POSShift]
    pagination: dict

class POSShiftResponse(BaseModel):
    shift: POSShift

# POS Dashboard Models
class POSMetrics(BaseModel):
    totalSales: float
    totalTransactions: int
    averageTransactionValue: float
    topProducts: List[Dict[str, Any]]
    dailySales: List[Dict[str, Any]]
    openShift: Optional[POSShift] = None

class POSDashboard(BaseModel):
    metrics: POSMetrics
    recentTransactions: List[POSTransaction]
    lowStockProducts: List[Product]

# POS Filter Models
class ProductFilters(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    lowStock: Optional[bool] = None
    isActive: Optional[bool] = None

class POSTransactionFilters(BaseModel):
    status: Optional[str] = None
    paymentMethod: Optional[str] = None
    shiftId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    search: Optional[str] = None

class POSShiftFilters(BaseModel):
    status: Optional[str] = None
    cashierId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None

# Inventory Response Models
class WarehouseResponse(BaseModel):
    warehouse: Warehouse

class WarehousesResponse(BaseModel):
    warehouses: List[Warehouse]
    total: int

class StorageLocationResponse(BaseModel):
    storageLocation: StorageLocation

class StorageLocationsResponse(BaseModel):
    storageLocations: List[StorageLocation]
    total: int

class StockMovementResponse(BaseModel):
    stockMovement: StockMovement

class StockMovementsResponse(BaseModel):
    stockMovements: List[StockMovement]
    total: int

class PurchaseOrderResponse(BaseModel):
    purchaseOrder: PurchaseOrder

class PurchaseOrdersResponse(BaseModel):
    purchaseOrders: List[PurchaseOrder]
    total: int

class SupplierResponse(BaseModel):
    supplier: Supplier

class SuppliersResponse(BaseModel):
    suppliers: List[Supplier]
    total: int

class ReceivingResponse(BaseModel):
    receiving: Receiving

class ReceivingsResponse(BaseModel):
    receivings: List[Receiving]
    total: int

# Inventory Dashboard Models
class InventoryDashboardStats(BaseModel):
    totalProducts: int
    lowStockProducts: int
    outOfStockProducts: int
    totalWarehouses: int
    totalSuppliers: int
    pendingPurchaseOrders: int
    pendingReceivings: int
    totalStockValue: float
    lowStockAlerts: List[Dict[str, Any]]

class StockAlert(BaseModel):
    productId: str
    productName: str
    sku: str
    currentStock: int
    minStockLevel: int
    alertType: str  # low_stock, out_of_stock, expiry_warning
    message: str

class InventoryReport(BaseModel):
    reportType: str
    dateRange: str
    data: List[Dict[str, Any]]
    summary: Dict[str, Any]

# Ledger Models
class ChartOfAccountsBase(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    account_category: str
    description: Optional[str] = None
    parent_account_id: Optional[str] = None
    is_active: bool = True
    is_system_account: bool = False
    opening_balance: float = 0.0
    current_balance: float = 0.0
    currency: str = "USD"

class ChartOfAccountsCreate(ChartOfAccountsBase):
    pass

class ChartOfAccountsUpdate(BaseModel):
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    account_category: Optional[str] = None
    description: Optional[str] = None
    parent_account_id: Optional[str] = None
    is_active: Optional[bool] = None
    opening_balance: Optional[float] = None
    current_balance: Optional[float] = None
    currency: Optional[str] = None

class ChartOfAccountsResponse(ChartOfAccountsBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LedgerTransactionBase(BaseModel):
    transaction_date: datetime
    transaction_type: str
    amount: float
    description: str
    reference_number: Optional[str] = None
    account_id: str
    contra_account_id: Optional[str] = None
    status: str = "pending"
    metadata: Optional[Dict[str, Any]] = None

class LedgerTransactionCreate(LedgerTransactionBase):
    pass

class LedgerTransactionUpdate(BaseModel):
    transaction_date: Optional[datetime] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    reference_number: Optional[str] = None
    account_id: Optional[str] = None
    contra_account_id: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class LedgerTransactionResponse(LedgerTransactionBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    entry_date: datetime
    reference_number: str
    description: str
    status: str = "draft"
    is_posted: bool = False
    posted_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryUpdate(BaseModel):
    entry_date: Optional[datetime] = None
    reference_number: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_posted: Optional[bool] = None
    posted_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FinancialPeriodBase(BaseModel):
    period_name: str
    start_date: datetime
    end_date: datetime
    is_closed: bool = False
    closed_date: Optional[datetime] = None
    notes: Optional[str] = None

class FinancialPeriodCreate(FinancialPeriodBase):
    pass

class FinancialPeriodUpdate(BaseModel):
    period_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_closed: Optional[bool] = None
    closed_date: Optional[datetime] = None
    notes: Optional[str] = None

class FinancialPeriodResponse(FinancialPeriodBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    budget_name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    total_amount: float
    currency: str = "USD"
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    budget_name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class BudgetResponse(BudgetBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetItemBase(BaseModel):
    account_id: str
    budgeted_amount: float
    actual_amount: float = 0.0
    variance: float = 0.0
    notes: Optional[str] = None

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemUpdate(BaseModel):
    account_id: Optional[str] = None
    budgeted_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    variance: Optional[float] = None
    notes: Optional[str] = None

class BudgetItemResponse(BudgetItemBase):
    id: str
    budget_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TrialBalanceAccount(BaseModel):
    account_id: str
    account_code: str
    account_name: str
    account_type: str
    account_category: str
    debit_balance: float
    credit_balance: float

class TrialBalanceResponse(BaseModel):
    as_of_date: datetime
    accounts: List[TrialBalanceAccount]

class IncomeStatementPeriod(BaseModel):
    start_date: datetime
    end_date: datetime

class IncomeStatementResponse(BaseModel):
    period: IncomeStatementPeriod
    revenue: float
    expenses: float
    net_income: float

class BalanceSheetAccount(BaseModel):
    account_id: str
    account_name: str
    balance: float

class BalanceSheetSection(BaseModel):
    total: float
    accounts: List[BalanceSheetAccount]

class BalanceSheetResponse(BaseModel):
    as_of_date: datetime
    assets: BalanceSheetSection
    liabilities: BalanceSheetSection
    equity: BalanceSheetSection
    total_liabilities_and_equity: float

# Ledger Response Models
class ChartOfAccountsListResponse(BaseModel):
    accounts: List[ChartOfAccountsResponse]
    total: int

class LedgerTransactionsListResponse(BaseModel):
    transactions: List[LedgerTransactionResponse]
    total: int

class JournalEntriesListResponse(BaseModel):
    entries: List[JournalEntryResponse]
    total: int

class FinancialPeriodsListResponse(BaseModel):
    periods: List[FinancialPeriodResponse]
    total: int

class BudgetsListResponse(BaseModel):
    budgets: List[BudgetResponse]
    total: int

class BudgetItemsListResponse(BaseModel):
    items: List[BudgetItemResponse]
    total: int