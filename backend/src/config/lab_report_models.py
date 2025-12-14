import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class LabReport(Base):
    __tablename__ = "lab_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    reportNumber = Column(String, nullable=False)
    reportDate = Column(Date, nullable=False)
    orderedBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    testName = Column(String, nullable=False)
    testCategory = Column(String)
    testResults = Column(JSON, default=[])
    labName = Column(String)
    labAddress = Column(Text)
    technicianName = Column(String)
    notes = Column(Text)
    attachments = Column(JSON, default=[])
    isVerified = Column(Boolean, default=False)
    verifiedBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verifiedAt = Column(DateTime, nullable=True)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="lab_reports")
    patient = relationship("Patient", back_populates="lab_reports")
    appointment = relationship("Appointment", back_populates="lab_reports")
    orderedByDoctor = relationship("User", foreign_keys=[orderedBy])
    verifiedByUser = relationship("User", foreign_keys=[verifiedBy])
    createdBy = relationship("User", foreign_keys=[createdById])
    
    __table_args__ = (
        Index('idx_lab_report_tenant_date', 'tenant_id', 'reportDate'),
        Index('idx_lab_report_patient', 'patient_id'),
        Index('idx_lab_report_ordered_by', 'orderedBy'),
        Index('idx_lab_report_appointment', 'appointment_id'),
        Index('idx_lab_report_number', 'reportNumber'),
    )

