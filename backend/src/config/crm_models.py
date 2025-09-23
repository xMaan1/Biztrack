import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    company = Column(String)
    jobTitle = Column(String)
    leadSource = Column(String)
    status = Column(String, nullable=False, default="new")  # new, contacted, qualified, proposal, won, lost
    priority = Column(String, default="medium")  # low, medium, high, urgent
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="leads")
    assignedTo = relationship("User")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    customerId = Column(String, nullable=False)  # Custom customer ID like CUST001
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    mobile = Column(String)
    cnic = Column(String, unique=True, nullable=True)  # CNIC for Pakistani customers
    dateOfBirth = Column(DateTime)
    gender = Column(String)  # male, female, other
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String, default="Pakistan")
    postalCode = Column(String)
    customerType = Column(String, default="individual")  # individual, business
    customerStatus = Column(String, default="active")  # active, inactive, blocked
    creditLimit = Column(Float, default=0.0)
    currentBalance = Column(Float, default=0.0)
    paymentTerms = Column(String, default="Cash")  # Credit, Card, Cash, Due Payments
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    notes = Column(Text)
    tags = Column(JSON, default=[])  # Store tags as JSON array
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customers")
    assignedTo = relationship("User", foreign_keys=[assignedToId])
    
    # Indexes for search optimization
    __table_args__ = (
        Index('idx_customer_tenant_search', 'tenant_id', 'firstName', 'lastName'),
        Index('idx_customer_phone_search', 'tenant_id', 'phone'),
        Index('idx_customer_cnic_search', 'tenant_id', 'cnic'),
        Index('idx_customer_email_search', 'tenant_id', 'email'),
        Index('idx_customer_id_unique', 'tenant_id', 'customerId', unique=True),  # Unique customerId per tenant
    )

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    mobile = Column(String)
    jobTitle = Column(String)
    department = Column(String)
    companyId = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    contactSource = Column(String)
    isActive = Column(Boolean, default=True)
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="contacts")
    company = relationship("Company", back_populates="contacts")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    industry = Column(String)
    website = Column(String)
    phone = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postalCode = Column(String)
    annualRevenue = Column(Float)
    employeeCount = Column(Integer)
    isActive = Column(Boolean, default=True)
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="companies")
    contacts = relationship("Contact", back_populates="company")
    opportunities = relationship("Opportunity", back_populates="company")

class Opportunity(Base):
    __tablename__ = "opportunities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    companyId = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contactId = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    stage = Column(String, nullable=False, default="prospecting")  # prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    probability = Column(Integer, default=0)  # 0-100
    amount = Column(Float)
    expectedCloseDate = Column(DateTime)
    leadSource = Column(String)
    description = Column(Text)
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="opportunities")
    company = relationship("Company", back_populates="opportunities")
    contact = relationship("Contact")
    assignedTo = relationship("User")

class SalesActivity(Base):
    __tablename__ = "sales_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    type = Column(String, nullable=False)  # call, email, meeting, presentation, proposal
    subject = Column(String, nullable=False)
    description = Column(Text)
    relatedToType = Column(String)  # lead, contact, company, opportunity
    relatedToId = Column(UUID(as_uuid=True))
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    dueDate = Column(DateTime)
    completedAt = Column(DateTime)
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled
    priority = Column(String, default="medium")  # low, medium, high, urgent
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="sales_activities")
    assignedTo = relationship("User")
