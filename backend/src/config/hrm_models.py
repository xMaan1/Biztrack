import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    employeeId = Column(String, unique=True, index=True)  # Company employee ID
    department = Column(String)
    position = Column(String)
    hireDate = Column(Date, nullable=False)
    salary = Column(Float)
    managerId = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    isActive = Column(Boolean, default=True)
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="employees")
    user = relationship("User")
    manager = relationship("Employee", remote_side=[id])
    subordinates = relationship("Employee", back_populates="manager")
    training_enrollments = relationship("TrainingEnrollment", back_populates="employee")

class JobPosting(Base):
    __tablename__ = "job_postings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    department = Column(String)
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    responsibilities = Column(JSON, default=[])  # Store as JSON array
    salary = Column(String)
    location = Column(String)
    type = Column(String)  # full_time, part_time, contract, internship
    status = Column(String, default="open")  # open, closed, draft
    postedDate = Column(DateTime, default=datetime.utcnow)
    closingDate = Column(DateTime)
    benefits = Column(JSON, default=[])  # Store as JSON array
    hiringManagerId = Column("hiringmanagerid", UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tags = Column(JSON, default=[])  # Store as JSON array
    isActive = Column(Boolean, default=True)
    createdBy = Column("createdby", UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="job_postings")
    applications = relationship("Application", back_populates="jobPosting")
    hiring_manager = relationship("User", foreign_keys=[hiringManagerId])
    creator = relationship("User", foreign_keys=[createdBy])

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    employeeId = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    reviewerId = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    reviewDate = Column(DateTime, nullable=False)
    reviewPeriod = Column(String)  # Q1, Q2, Q3, Q4, Annual
    rating = Column(Integer)  # 1-5 scale
    strengths = Column(Text)
    areasForImprovement = Column(Text)
    goals = Column(Text)
    comments = Column(Text)
    nextReviewDate = Column(DateTime)
    isCompleted = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="performance_reviews")
    employee = relationship("Employee", foreign_keys=[employeeId])
    reviewer = relationship("Employee", foreign_keys=[reviewerId])

class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    employeeId = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    projectId = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    taskId = Column(UUID(as_uuid=True), ForeignKey("tasks.id"))
    date = Column(Date, nullable=False)
    startTime = Column(DateTime)
    endTime = Column(DateTime)
    hours = Column(Float, nullable=False)
    description = Column(Text)
    isApproved = Column(Boolean, default=False)
    approvedBy = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    approvedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="time_entries")
    employee = relationship("Employee", foreign_keys=[employeeId])
    project = relationship("Project")
    task = relationship("Task")
    approver = relationship("Employee", foreign_keys=[approvedBy])

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    employeeId = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    leaveType = Column(String, nullable=False)  # vacation, sick, personal, maternity, paternity
    startDate = Column(Date, nullable=False)
    endDate = Column(Date, nullable=False)
    days = Column(Integer, nullable=False)
    reason = Column(Text)
    status = Column(String, default="pending")  # pending, approved, rejected, cancelled
    approvedBy = Column(UUID(as_uuid=True), ForeignKey("employees.id"))
    approvedAt = Column(DateTime)
    comments = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="leave_requests")
    employee = relationship("Employee", foreign_keys=[employeeId])
    approver = relationship("Employee", foreign_keys=[approvedBy])

class Payroll(Base):
    __tablename__ = "payroll"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    employeeId = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    payPeriod = Column(String, nullable=False)  # weekly, bi_weekly, monthly
    startDate = Column(Date, nullable=False)
    endDate = Column(Date, nullable=False)
    baseSalary = Column(Float, nullable=False)
    overtimeHours = Column(Float, default=0.0)
    overtimeRate = Column(Float, default=0.0)
    bonuses = Column(Float, default=0.0)
    deductions = Column(Float, default=0.0)
    netPay = Column(Float, nullable=False)
    isProcessed = Column(Boolean, default=False)
    processedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="payroll")
    employee = relationship("Employee")

class Benefits(Base):
    __tablename__ = "benefits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    type = Column(String, nullable=False)  # health, dental, vision, retirement, other
    cost = Column(Float)
    employeeContribution = Column(Float, default=0.0)
    employerContribution = Column(Float, default=0.0)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="benefits")

class Training(Base):
    __tablename__ = "training"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    trainingType = Column(String, default="onboarding")  # onboarding, skill_development, compliance, leadership, technical, soft_skills, certification
    duration = Column(String, nullable=False)
    cost = Column(Float, default=0.0)
    provider = Column(String, nullable=False)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    maxParticipants = Column(Integer, nullable=True)
    status = Column(String, default="not_started")  # not_started, in_progress, completed, expired
    materials = Column(JSON, default=[])
    objectives = Column(JSON, default=[])
    prerequisites = Column(JSON, default=[])
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="training")
    creator = relationship("User", back_populates="created_training")
    enrollments = relationship("TrainingEnrollment", back_populates="training")

class TrainingEnrollment(Base):
    __tablename__ = "training_enrollments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    trainingId = Column(UUID(as_uuid=True), ForeignKey("training.id"), nullable=False)
    employeeId = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    enrollmentDate = Column(DateTime, nullable=False)
    completionDate = Column(DateTime, nullable=True)
    status = Column(String, default="not_started")  # not_started, in_progress, completed, expired
    score = Column(Integer, nullable=True)
    certificate = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="training_enrollments")
    training = relationship("Training", back_populates="enrollments")
    employee = relationship("Employee", back_populates="training_enrollments")
    creator = relationship("User", back_populates="created_training_enrollments")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    jobPostingId = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"), nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    resume = Column(String, nullable=True)
    coverLetter = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    skills = Column(JSON, default=[])
    status = Column(String, default="applied")  # applied, screening, interview, technical_test, reference_check, offer, hired, rejected, withdrawn
    assignedTo = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    interviewDate = Column(DateTime, nullable=True)
    interviewNotes = Column(Text, nullable=True)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="applications")
    jobPosting = relationship("JobPosting", back_populates="applications")
    assignee = relationship("User", foreign_keys=[assignedTo], back_populates="assigned_applications")
    creator = relationship("User", foreign_keys=[createdBy], back_populates="created_applications")

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, index=True)
    contactPerson = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postalCode = Column(String)
    website = Column(String)
    paymentTerms = Column(String)
    creditLimit = Column(Float, nullable=True)
    isActive = Column(Boolean, default=True)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="suppliers")
    creator = relationship("User", back_populates="created_suppliers")
    
    # Indexes for performance optimization
    __table_args__ = (
        Index("idx_suppliers_tenant_id", "tenant_id"),
        Index("idx_suppliers_code", "code"),
        Index("idx_suppliers_tenant_code", "tenant_id", "code", unique=True),  # Unique code per tenant
    )
