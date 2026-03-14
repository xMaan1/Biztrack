import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base


class Doctor(Base):
    __tablename__ = "healthcare_doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    pmdc_number = Column(String(50), nullable=False)
    phone = Column(String(50), nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email = Column(String(255))
    specialization = Column(String(255))
    qualification = Column(String(255))
    address = Column(Text)
    availability = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_doctors_tenant_pmdc", "tenant_id", "pmdc_number", unique=True),
        Index("ix_healthcare_doctors_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")


class Patient(Base):
    __tablename__ = "healthcare_patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50))
    email = Column(String(255))
    date_of_birth = Column(Date)
    address = Column(Text)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_patients_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")


class HealthcareStaff(Base):
    __tablename__ = "healthcare_staff"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone = Column(String(50))
    role = Column(String(255))
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_staff_tenant_user", "tenant_id", "user_id", unique=True),
        Index("ix_healthcare_staff_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant", back_populates="healthcare_staff")
    user = relationship("User")


class Appointment(Base):
    __tablename__ = "healthcare_appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_patients.id", ondelete="SET NULL"), nullable=True)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50))
    appointment_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    status = Column(String(50), default="scheduled")
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_appointments_tenant_id", "tenant_id"),
        Index("ix_healthcare_appointments_doctor_date", "tenant_id", "doctor_id", "appointment_date"),
    )

    tenant = relationship("Tenant", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    prescriptions = relationship("Prescription", back_populates="appointment")


class Prescription(Base):
    __tablename__ = "healthcare_prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_appointments.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_doctors.id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50))
    prescription_date = Column(Date, nullable=False)
    notes = Column(Text)
    items = Column(JSON, default=list)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_prescriptions_tenant_id", "tenant_id"),
        Index("ix_healthcare_prescriptions_appointment_id", "appointment_id"),
    )

    tenant = relationship("Tenant", back_populates="prescriptions")
    appointment = relationship("Appointment", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
