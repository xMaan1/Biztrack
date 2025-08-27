import uuid
from sqlalchemy import Column, String, DateTime, Float, Text, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    invoiceNumber = Column(String, unique=True, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    customerId = Column(String, nullable=True)
    customerName = Column(String, nullable=False)
    customerEmail = Column(String, nullable=True)
    customerPhone = Column(String, nullable=True)  # New field for customer phone
    billingAddress = Column(Text, nullable=True)
    shippingAddress = Column(Text, nullable=True)
    issueDate = Column(DateTime, nullable=False)
    dueDate = Column(DateTime, nullable=False)
    orderNumber = Column(String, nullable=True)  # New field for order number
    orderTime = Column(DateTime, nullable=True)  # New field for order time
    paymentTerms = Column(String, nullable=True)
    currency = Column(String, default="USD")
    taxRate = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    discountAmount = Column(Float, default=0.0)
    taxAmount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    opportunityId = Column(String, nullable=True)
    quoteId = Column(String, nullable=True)
    projectId = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, sent, paid, overdue, cancelled
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    payments = relationship("Payment", back_populates="invoice")
    tenant = relationship("Tenant", back_populates="invoices")
    creator = relationship("User", back_populates="created_invoices")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    invoiceId = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    amount = Column(Float, nullable=False)
    paymentDate = Column(DateTime, nullable=False)
    paymentMethod = Column(String, nullable=False)  # credit_card, bank_transfer, cash, check
    reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, completed, failed, refunded
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    tenant = relationship("Tenant", back_populates="payments")
