import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class MedicalSupply(Base):
    __tablename__ = "medical_supplies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    supplyId = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    description = Column(Text)
    unit = Column(String, default="piece")
    stockQuantity = Column(Integer, default=0)
    minStockLevel = Column(Integer, default=0)
    maxStockLevel = Column(Integer)
    unitPrice = Column(Float, default=0.0)
    expiryDate = Column(Date)
    batchNumber = Column(String)
    supplier = Column(String)
    location = Column(String)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="medical_supplies")
    
    __table_args__ = (
        Index('idx_medical_supply_tenant_search', 'tenant_id', 'name'),
        Index('idx_medical_supply_id_unique', 'tenant_id', 'supplyId', unique=True),
    )

