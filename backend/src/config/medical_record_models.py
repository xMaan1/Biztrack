import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    recordType = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    diagnosis = Column(Text)
    treatment = Column(Text)
    medications = Column(JSON, default=[])
    vitalSigns = Column(JSON, default={})
    labResults = Column(JSON, default={})
    attachments = Column(JSON, default=[])
    visitDate = Column(Date, nullable=False)
    doctorId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    isConfidential = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="medical_records")
    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("User", foreign_keys=[doctorId])
    createdBy = relationship("User", foreign_keys=[createdById])
    
    __table_args__ = (
        Index('idx_medical_record_tenant_patient', 'tenant_id', 'patient_id'),
        Index('idx_medical_record_date', 'visitDate'),
    )

