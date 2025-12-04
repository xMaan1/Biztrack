import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    patientId = Column(String, nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    mobile = Column(String)
    dateOfBirth = Column(Date)
    gender = Column(String)
    bloodGroup = Column(String)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String, default="Pakistan")
    postalCode = Column(String)
    emergencyContactName = Column(String)
    emergencyContactPhone = Column(String)
    emergencyContactRelation = Column(String)
    insuranceProvider = Column(String)
    insurancePolicyNumber = Column(String)
    allergies = Column(JSON, default=[])
    chronicConditions = Column(JSON, default=[])
    medications = Column(JSON, default=[])
    notes = Column(Text)
    status = Column(String, default="active")
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="patients")
    assignedTo = relationship("User", foreign_keys=[assignedToId])
    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    
    __table_args__ = (
        Index('idx_patient_tenant_search', 'tenant_id', 'firstName', 'lastName'),
        Index('idx_patient_phone_search', 'tenant_id', 'phone'),
        Index('idx_patient_id_unique', 'tenant_id', 'patientId', unique=True),
    )

