import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, JSON, ForeignKey, Index, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base


class ExpenseCategory(Base):
    __tablename__ = "healthcare_expense_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_expense_categories_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant", back_populates="expense_categories")
    expenses = relationship("DailyExpense", back_populates="category")


class DailyExpense(Base):
    __tablename__ = "healthcare_daily_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_expense_categories.id", ondelete="RESTRICT"), nullable=False)
    expense_date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_daily_expenses_tenant_id", "tenant_id"),
        Index("ix_healthcare_daily_expenses_category_id", "category_id"),
        Index("ix_healthcare_daily_expenses_expense_date", "tenant_id", "expense_date"),
    )

    tenant = relationship("Tenant", back_populates="daily_expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")


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
    appointments = relationship("Appointment", back_populates="doctor", passive_deletes=True)
    prescriptions = relationship("Prescription", back_populates="doctor", passive_deletes=True)
    admissions = relationship("Admission", back_populates="doctor", passive_deletes=True)


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
    admissions = relationship("Admission", back_populates="patient")


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


class Admission(Base):
    __tablename__ = "healthcare_admissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_doctors.id", ondelete="CASCADE"), nullable=False)
    admit_date = Column(Date, nullable=False)
    discharge_date = Column(Date, nullable=True)
    status = Column(String(50), default="admitted")
    ward = Column(String(255), nullable=False)
    room_or_bed = Column(String(100), nullable=True)
    diagnosis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_admissions_tenant_id", "tenant_id"),
        Index("ix_healthcare_admissions_tenant_status", "tenant_id", "status"),
        Index("ix_healthcare_admissions_tenant_admit_date", "tenant_id", "admit_date"),
        Index("ix_healthcare_admissions_patient_id", "patient_id"),
        Index("ix_healthcare_admissions_doctor_id", "doctor_id"),
    )

    tenant = relationship("Tenant", back_populates="admissions")
    patient = relationship("Patient", back_populates="admissions")
    doctor = relationship("Doctor", back_populates="admissions")
