import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey
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
