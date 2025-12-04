import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, Date, Time, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    appointmentDate = Column(Date, nullable=False)
    appointmentTime = Column(Time, nullable=False)
    duration = Column(Integer, default=30)
    type = Column(String, nullable=False)
    status = Column(String, default="scheduled")
    reason = Column(Text)
    notes = Column(Text)
    doctorId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reminderSent = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User", foreign_keys=[doctorId])
    createdBy = relationship("User", foreign_keys=[createdById])
    
    __table_args__ = (
        Index('idx_appointment_tenant_date', 'tenant_id', 'appointmentDate'),
        Index('idx_appointment_patient', 'patient_id'),
        Index('idx_appointment_doctor', 'doctorId'),
    )

