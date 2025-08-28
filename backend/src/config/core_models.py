import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

# Association tables
project_team_members = Table(
    'project_team_members',
    Base.metadata,
    Column('project_id', UUID(as_uuid=True), ForeignKey('projects.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)  # Nullable for system users
    userName = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    firstName = Column(String)
    lastName = Column(String)
    hashedPassword = Column(String, nullable=False)
    userRole = Column(String, nullable=False, default="team_member")  # super_admin, project_manager, team_member, client
    avatar = Column(String)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    managed_projects = relationship("Project", foreign_keys="Project.projectManagerId", back_populates="projectManager")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignedToId", back_populates="assignedTo")
    created_tasks = relationship("Task", foreign_keys="Task.createdById", back_populates="createdBy")
    team_projects = relationship("Project", secondary=project_team_members, back_populates="teamMembers")
    
    # Custom tenant-specific options relationships
    createdCustomEventTypes = relationship("CustomEventType", back_populates="createdByUser", foreign_keys="CustomEventType.createdByUserId")
    createdCustomDepartments = relationship("CustomDepartment", back_populates="createdByUser", foreign_keys="CustomDepartment.createdByUserId")
    createdCustomLeaveTypes = relationship("CustomLeaveType", back_populates="createdByUser", foreign_keys="CustomLeaveType.createdByUserId")
    createdCustomLeadSources = relationship("CustomLeadSource", back_populates="createdByUser", foreign_keys="CustomLeadSource.createdByUserId")
    createdCustomContactSources = relationship("CustomContactSource", back_populates="createdByUser", foreign_keys="CustomContactSource.createdByUserId")
    createdCustomCompanyIndustries = relationship("CustomCompanyIndustry", back_populates="createdByUser", foreign_keys="CustomCompanyIndustry.createdByUserId")
    createdCustomContactTypes = relationship("CustomContactType", back_populates="createdByUser", foreign_keys="CustomContactType.createdByUserId")
    createdCustomIndustries = relationship("CustomIndustry", back_populates="createdByUser", foreign_keys="CustomIndustry.createdByUserId")
    
    # Sales relationships
    created_quotes = relationship("Quote", back_populates="creator", foreign_keys="Quote.createdBy")
    created_contracts = relationship("Contract", back_populates="creator", foreign_keys="Contract.createdBy")
    
    # Inventory relationships
    created_storage_locations = relationship("StorageLocation", back_populates="creator", foreign_keys="StorageLocation.createdBy")
    created_stock_movements = relationship("StockMovement", back_populates="creator", foreign_keys="StockMovement.createdBy")
    
    # POS relationships
    pos_shifts = relationship("POSShift", back_populates="employee", foreign_keys="POSShift.employeeId")
    
    # HRM relationships
    created_training = relationship("Training", back_populates="creator", foreign_keys="Training.createdBy")
    created_training_enrollments = relationship("TrainingEnrollment", back_populates="creator", foreign_keys="TrainingEnrollment.createdBy")
    assigned_applications = relationship("Application", back_populates="assignee", foreign_keys="Application.assignedTo")
    created_applications = relationship("Application", back_populates="creator", foreign_keys="Application.createdBy")
    
    # Invoice relationships
    created_invoices = relationship("Invoice", back_populates="creator", foreign_keys="Invoice.createdBy")

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True)
    description = Column(Text)
    settings = Column(JSON, default={})
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    projects = relationship("Project", back_populates="tenant")
    subscriptions = relationship("Subscription", back_populates="tenant")
    tenant_users = relationship("TenantUser", back_populates="tenant")
    
    # Sales relationships
    quotes = relationship("Quote", back_populates="tenant")
    contracts = relationship("Contract", back_populates="tenant")
    
    # CRM relationships
    leads = relationship("Lead", back_populates="tenant")
    contacts = relationship("Contact", back_populates="tenant")
    companies = relationship("Company", back_populates="tenant")
    opportunities = relationship("Opportunity", back_populates="tenant")
    sales_activities = relationship("SalesActivity", back_populates="tenant")
    
    # Inventory relationships
    products = relationship("Product", back_populates="tenant")
    warehouses = relationship("Warehouse", back_populates="tenant")
    suppliers = relationship("Supplier", back_populates="tenant")
    purchase_orders = relationship("PurchaseOrder", back_populates="tenant")
    receiving = relationship("Receiving", back_populates="tenant")
    storage_locations = relationship("StorageLocation", back_populates="tenant")
    stock_movements = relationship("StockMovement", back_populates="tenant")
    
    # Invoice relationships
    invoices = relationship("Invoice", back_populates="tenant")
    payments = relationship("Payment", back_populates="tenant")
    
    # POS relationships
    pos_shifts = relationship("POSShift", back_populates="tenant")
    pos_transactions = relationship("POSTransaction", back_populates="tenant")
    
    # HRM relationships
    employees = relationship("Employee", back_populates="tenant")
    job_postings = relationship("JobPosting", back_populates="tenant")
    performance_reviews = relationship("PerformanceReview", back_populates="tenant")
    time_entries = relationship("TimeEntry", back_populates="tenant")
    leave_requests = relationship("LeaveRequest", back_populates="tenant")
    payroll = relationship("Payroll", back_populates="tenant")
    benefits = relationship("Benefits", back_populates="tenant")
    training = relationship("Training", back_populates="tenant")
    training_enrollments = relationship("TrainingEnrollment", back_populates="tenant")
    applications = relationship("Application", back_populates="tenant")
    
    # Custom tenant-specific options relationships
    customEventTypes = relationship("CustomEventType", back_populates="tenant")
    customDepartments = relationship("CustomDepartment", back_populates="tenant")
    customLeaveTypes = relationship("CustomLeaveType", back_populates="tenant")
    customLeadSources = relationship("CustomLeadSource", back_populates="tenant")
    customContactSources = relationship("CustomContactSource", back_populates="tenant")
    customCompanyIndustries = relationship("CustomCompanyIndustry", back_populates="tenant")
    customContactTypes = relationship("CustomContactType", back_populates="tenant")
    customIndustries = relationship("CustomIndustry", back_populates="tenant")

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    planType = Column(String, nullable=False)  # starter, professional, enterprise
    price = Column(Float, nullable=False)
    billingCycle = Column(String, nullable=False)  # monthly, yearly
    maxProjects = Column(Integer)
    maxUsers = Column(Integer)
    features = Column(JSON)  # Store as JSON array
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    planId = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    status = Column(String, nullable=False, default="trial")  # active, inactive, cancelled, expired, trial
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime)
    autoRenew = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")

class TenantUser(Base):
    __tablename__ = "tenant_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # owner, admin, manager, member, viewer
    permissions = Column(JSON, default=[])
    isActive = Column(Boolean, default=True)
    invitedBy = Column(UUID(as_uuid=True))
    joinedAt = Column(DateTime, default=datetime.utcnow)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="tenant_users")
