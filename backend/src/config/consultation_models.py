import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Date, Time, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Consultation(Base):
    __tablename__ = "consultations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    consultationDate = Column(Date, nullable=False)
    consultationTime = Column(Time, nullable=False)
    doctorId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chiefComplaint = Column(Text)
    historyOfPresentIllness = Column(Text)
    physicalExamination = Column(Text)
    assessment = Column(Text)
    plan = Column(Text)
    prescriptions = Column(JSON, default=[])
    followUpDate = Column(Date)
    followUpNotes = Column(Text)
    vitalSigns = Column(JSON, default={})
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="consultations")
    patient = relationship("Patient", back_populates="consultations")
    appointment = relationship("Appointment", back_populates="consultations")
    doctor = relationship("User", foreign_keys=[doctorId])
    createdBy = relationship("User", foreign_keys=[createdById])
    
    __table_args__ = (
        Index('idx_consultation_tenant_date', 'tenant_id', 'consultationDate'),
        Index('idx_consultation_patient', 'patient_id'),
        Index('idx_consultation_doctor', 'doctorId'),
        Index('idx_consultation_appointment', 'appointment_id'),
    )

