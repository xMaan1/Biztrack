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
    lastLogin = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    tenant_users = relationship("TenantUser", back_populates="user")
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
    
    # Event relationships
    created_events = relationship("Event", back_populates="createdBy", foreign_keys="Event.createdById")
    
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
    
    # Inventory relationships
    created_suppliers = relationship("Supplier", back_populates="creator", foreign_keys="Supplier.createdBy")
    
    # Work Order relationships
    assigned_work_orders = relationship("WorkOrder", foreign_keys="WorkOrder.assigned_to_id", back_populates="assigned_to")
    created_work_orders = relationship("WorkOrder", foreign_keys="WorkOrder.created_by_id", back_populates="created_by")
    approved_work_orders = relationship("WorkOrder", foreign_keys="WorkOrder.approved_by_id", back_populates="approved_by")
    
    # Production relationships
    assigned_production_plans = relationship("ProductionPlan", foreign_keys="ProductionPlan.assigned_to_id", back_populates="assigned_to")
    created_production_plans = relationship("ProductionPlan", foreign_keys="ProductionPlan.created_by_id", back_populates="created_by")
    approved_production_plans = relationship("ProductionPlan", foreign_keys="ProductionPlan.approved_by_id", back_populates="approved_by")
    
    # Ledger relationships
    created_chart_of_accounts = relationship("ChartOfAccounts", foreign_keys="ChartOfAccounts.created_by", back_populates="created_by_user")
    created_ledger_transactions = relationship("LedgerTransaction", foreign_keys="LedgerTransaction.created_by", back_populates="created_by_user")
    approved_ledger_transactions = relationship("LedgerTransaction", foreign_keys="LedgerTransaction.approved_by", back_populates="approved_by_user")
    created_journal_entries = relationship("JournalEntry", foreign_keys="JournalEntry.created_by", back_populates="created_by_user")
    posted_journal_entries = relationship("JournalEntry", foreign_keys="JournalEntry.posted_by", back_populates="posted_by_user")
    created_financial_periods = relationship("FinancialPeriod", foreign_keys="FinancialPeriod.created_by", back_populates="created_by_user")
    closed_financial_periods = relationship("FinancialPeriod", foreign_keys="FinancialPeriod.closed_by", back_populates="closed_by_user")
    created_budgets = relationship("Budget", foreign_keys="Budget.created_by", back_populates="created_by_user")
    
    # Quality Control relationships
    assigned_quality_checks = relationship("QualityCheck", foreign_keys="QualityCheck.assigned_to_id", back_populates="assigned_to")
    created_quality_checks = relationship("QualityCheck", foreign_keys="QualityCheck.created_by_id", back_populates="created_by")
    conducted_inspections = relationship("QualityInspection", foreign_keys="QualityInspection.inspector_id", back_populates="inspector")
    detected_defects = relationship("QualityDefect", foreign_keys="QualityDefect.detected_by_id", back_populates="detected_by")
    assigned_defects = relationship("QualityDefect", foreign_keys="QualityDefect.assigned_to_id", back_populates="assigned_to")
    generated_quality_reports = relationship("QualityReport", foreign_keys="QualityReport.generated_by_id", back_populates="generated_by")
    
    # Maintenance relationships
    assigned_maintenance_schedules = relationship("MaintenanceSchedule", foreign_keys="MaintenanceSchedule.assigned_technician_id", back_populates="assigned_technician")
    created_maintenance_schedules = relationship("MaintenanceSchedule", foreign_keys="MaintenanceSchedule.created_by_id", back_populates="created_by")
    updated_maintenance_schedules = relationship("MaintenanceSchedule", foreign_keys="MaintenanceSchedule.updated_by_id", back_populates="updated_by")
    maintenance_technician_work_orders = relationship("MaintenanceWorkOrder", foreign_keys="MaintenanceWorkOrder.technician_id", back_populates="technician")
    approved_maintenance_work_orders = relationship("MaintenanceWorkOrder", foreign_keys="MaintenanceWorkOrder.approved_by_id", back_populates="approved_by")
    created_maintenance_work_orders = relationship("MaintenanceWorkOrder", foreign_keys="MaintenanceWorkOrder.created_by_id", back_populates="created_by")
    updated_maintenance_work_orders = relationship("MaintenanceWorkOrder", foreign_keys="MaintenanceWorkOrder.updated_by_id", back_populates="updated_by")
    generated_maintenance_reports = relationship("MaintenanceReport", foreign_keys="MaintenanceReport.technician_id", back_populates="technician")
    approved_maintenance_reports = relationship("MaintenanceReport", foreign_keys="MaintenanceReport.approved_by_id", back_populates="approved_by")
    created_maintenance_reports = relationship("MaintenanceReport", foreign_keys="MaintenanceReport.created_by_id", back_populates="created_by")
    updated_maintenance_reports = relationship("MaintenanceReport", foreign_keys="MaintenanceReport.updated_by_id", back_populates="updated_by")
    
    # Equipment relationships
    created_equipment = relationship("Equipment", foreign_keys="Equipment.created_by_id", back_populates="created_by")
    updated_equipment = relationship("Equipment", foreign_keys="Equipment.updated_by_id", back_populates="updated_by")
    
    # Investment relationships
    created_investments = relationship("Investment", foreign_keys="Investment.created_by", back_populates="created_by_user")
    approved_investments = relationship("Investment", foreign_keys="Investment.approved_by", back_populates="approved_by_user")
    created_equipment_investments = relationship("EquipmentInvestment", foreign_keys="EquipmentInvestment.created_by", back_populates="created_by_user")
    created_investment_transactions = relationship("InvestmentTransaction", foreign_keys="InvestmentTransaction.created_by", back_populates="created_by_user")

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, unique=True, index=True)
    description = Column(Text)
    logo_url = Column(String, nullable=True)
    settings = Column(JSON, default={})
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    projects = relationship("Project", back_populates="tenant")
    subscriptions = relationship("Subscription", back_populates="tenant")
    tenant_users = relationship("TenantUser", back_populates="tenant")
    roles = relationship("Role", back_populates="tenant")
    
    
    # Sales relationships
    quotes = relationship("Quote", back_populates="tenant")
    contracts = relationship("Contract", back_populates="tenant")
    
    # CRM relationships
    leads = relationship("Lead", back_populates="tenant")
    contacts = relationship("Contact", back_populates="tenant")
    companies = relationship("Company", back_populates="tenant")
    opportunities = relationship("Opportunity", back_populates="tenant")
    sales_activities = relationship("SalesActivity", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    
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
    events = relationship("Event", back_populates="tenant")
    
    # Work Order relationships
    work_orders = relationship("WorkOrder", back_populates="tenant")
    
    # Production relationships
    production_plans = relationship("ProductionPlan", back_populates="tenant")
    production_schedules = relationship("ProductionSchedule", back_populates="tenant")
    
    # Ledger relationships
    chart_of_accounts = relationship("ChartOfAccounts", back_populates="tenant")
    ledger_transactions = relationship("LedgerTransaction", back_populates="tenant")
    journal_entries = relationship("JournalEntry", back_populates="tenant")
    financial_periods = relationship("FinancialPeriod", back_populates="tenant")
    budgets = relationship("Budget", back_populates="tenant")
    
    # Banking relationships
    bank_accounts = relationship("BankAccount", back_populates="tenant")
    bank_transactions = relationship("BankTransaction", back_populates="tenant")
    cash_positions = relationship("CashPosition", back_populates="tenant")
    tills = relationship("Till", back_populates="tenant")
    till_transactions = relationship("TillTransaction", back_populates="tenant")
    
    customDepartments = relationship("CustomDepartment", back_populates="tenant")
    customLeaveTypes = relationship("CustomLeaveType", back_populates="tenant")
    customLeadSources = relationship("CustomLeadSource", back_populates="tenant")
    customContactSources = relationship("CustomContactSource", back_populates="tenant")
    customCompanyIndustries = relationship("CustomCompanyIndustry", back_populates="tenant")
    customContactTypes = relationship("CustomContactType", back_populates="tenant")
    customIndustries = relationship("CustomIndustry", back_populates="tenant")
    
    # Quality Control relationships
    quality_checks = relationship("QualityCheck", back_populates="tenant")
    quality_inspections = relationship("QualityInspection", back_populates="tenant")
    quality_defects = relationship("QualityDefect", back_populates="tenant")
    quality_reports = relationship("QualityReport", back_populates="tenant")
    
    # Maintenance relationships
    maintenance_schedules = relationship("MaintenanceSchedule", back_populates="tenant")
    maintenance_work_orders = relationship("MaintenanceWorkOrder", back_populates="tenant")
    maintenance_reports = relationship("MaintenanceReport", back_populates="tenant")
    
    # Equipment relationships
    equipment = relationship("Equipment", back_populates="tenant")
    
    # Invoice customization relationships
    invoice_customizations = relationship("InvoiceCustomization", back_populates="tenant")
    
    # Investment relationships
    investments = relationship("Investment", back_populates="tenant")
    equipment_investments = relationship("EquipmentInvestment", back_populates="tenant")
    investment_transactions = relationship("InvestmentTransaction", back_populates="tenant")
    
    # Account Receivable relationships
    account_receivables = relationship("AccountReceivable", back_populates="tenant")

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
    modules = Column(JSON, default=[])  # Store as JSON array
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
    isActive = Column(Boolean, default=True)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime)
    autoRenew = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)  # owner, crm_manager, hrm_manager, etc.
    display_name = Column(String, nullable=False)
    description = Column(Text)
    permissions = Column(JSON, default=[])  # List of module permissions
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="roles")
    tenant_users = relationship("TenantUser", back_populates="role_obj")

class TenantUser(Base):
    __tablename__ = "tenant_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    role = Column(String(50), nullable=False)  # Role name for quick access
    custom_permissions = Column(JSON, default=[])  # Additional permissions beyond role
    isActive = Column(Boolean, default=True)
    invitedBy = Column(UUID(as_uuid=True))
    joinedAt = Column(DateTime, default=datetime.utcnow)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="tenant_users")
    user = relationship("User", back_populates="tenant_users")
    role_obj = relationship("Role", back_populates="tenant_users")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")