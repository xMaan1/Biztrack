from pydantic import BaseModel
from typing import Optional, List, Any, Literal
from datetime import datetime, date


class DoctorAvailabilitySlot(BaseModel):
    day: str
    start_time: str
    end_time: str


class DoctorBase(BaseModel):
    pmdc_number: str
    phone: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    address: Optional[str] = None
    availability: List[DoctorAvailabilitySlot] = []


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    pmdc_number: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    address: Optional[str] = None
    availability: Optional[List[DoctorAvailabilitySlot]] = None
    is_active: Optional[bool] = None


class Doctor(DoctorBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DoctorsResponse(BaseModel):
    doctors: List[Doctor]
    total: int


class HealthcareStaffBase(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []


class HealthcareStaffCreate(HealthcareStaffBase):
    password: str


class HealthcareStaffUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class HealthcareStaff(HealthcareStaffBase):
    id: str
    tenant_id: str
    user_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class HealthcareStaffResponse(BaseModel):
    staff: List[HealthcareStaff]
    total: int


class PatientBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Patient(PatientBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class PatientsResponse(BaseModel):
    patients: List[Patient]
    total: int


class AppointmentBase(BaseModel):
    doctor_id: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    appointment_date: date
    start_time: str
    end_time: str
    status: str = "scheduled"
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    appointment_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Appointment(AppointmentBase):
    id: str
    tenant_id: str
    patient_id: Optional[str] = None
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentsResponse(BaseModel):
    appointments: List[Appointment]
    total: int


class PrescriptionItem(BaseModel):
    type: Literal["medicine", "vitals", "test"] = "medicine"
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    vital_name: Optional[str] = None
    vital_value: Optional[str] = None
    vital_unit: Optional[str] = None
    test_name: Optional[str] = None
    test_instructions: Optional[str] = None


class PrescriptionBase(BaseModel):
    appointment_id: str
    doctor_id: str
    patient_name: str
    patient_phone: Optional[str] = None
    prescription_date: date
    notes: Optional[str] = None
    items: List[PrescriptionItem] = []


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    doctor_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    prescription_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[PrescriptionItem]] = None


class Prescription(PrescriptionBase):
    id: str
    tenant_id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None
    appointment_date: Optional[str] = None

    class Config:
        from_attributes = True


class PrescriptionsResponse(BaseModel):
    prescriptions: List[Prescription]
    total: int


class AppointmentInvoiceLineItem(BaseModel):
    description: str
    amount: float


class AppointmentInvoiceCreate(BaseModel):
    line_items: List[AppointmentInvoiceLineItem]
    currency: str = "USD"
    tax_rate: float = 0.0
    discount: float = 0.0
