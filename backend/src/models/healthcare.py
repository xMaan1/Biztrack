from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from uuid import UUID

class PatientBase(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    bloodGroup: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(default="Pakistan", max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insurancePolicyNumber: Optional[str] = None
    allergies: Optional[List[str]] = Field(default_factory=list)
    chronicConditions: Optional[List[str]] = Field(default_factory=list)
    medications: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None
    status: Optional[str] = Field(default="active", pattern=r"^(active|inactive)$")
    assignedToId: Optional[UUID] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=100)
    lastName: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    bloodGroup: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insurancePolicyNumber: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronicConditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(active|inactive)$")
    assignedToId: Optional[UUID] = None

class PatientResponse(PatientBase):
    id: UUID
    patientId: str
    tenant_id: UUID
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class PatientStatsResponse(BaseModel):
    total: int
    active: int
    inactive: int

class AppointmentBase(BaseModel):
    patient_id: UUID
    appointmentDate: date
    appointmentTime: str
    duration: Optional[int] = Field(default=30, ge=1, le=480)
    type: str = Field(..., min_length=1, max_length=100)
    status: Optional[str] = Field(default="scheduled", pattern=r"^(scheduled|confirmed|completed|cancelled|no_show)$")
    reason: Optional[str] = None
    notes: Optional[str] = None
    doctorId: Optional[UUID] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    appointmentDate: Optional[date] = None
    appointmentTime: Optional[str] = None
    duration: Optional[int] = Field(None, ge=1, le=480)
    type: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, pattern=r"^(scheduled|confirmed|completed|cancelled|no_show)$")
    reason: Optional[str] = None
    notes: Optional[str] = None
    doctorId: Optional[UUID] = None

class AppointmentResponse(AppointmentBase):
    id: UUID
    tenant_id: UUID
    createdById: UUID
    reminderSent: bool
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class AppointmentStatsResponse(BaseModel):
    total: int
    scheduled: int
    completed: int
    cancelled: int
    today: int

class MedicalRecordBase(BaseModel):
    patient_id: UUID
    recordType: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    medications: Optional[List[str]] = Field(default_factory=list)
    vitalSigns: Optional[Dict[str, Any]] = Field(default_factory=dict)
    labResults: Optional[Dict[str, Any]] = Field(default_factory=dict)
    attachments: Optional[List[str]] = Field(default_factory=list)
    visitDate: date
    doctorId: Optional[UUID] = None
    isConfidential: Optional[bool] = Field(default=False)

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    recordType: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    medications: Optional[List[str]] = None
    vitalSigns: Optional[Dict[str, Any]] = None
    labResults: Optional[Dict[str, Any]] = None
    attachments: Optional[List[str]] = None
    visitDate: Optional[date] = None
    doctorId: Optional[UUID] = None
    isConfidential: Optional[bool] = None

class MedicalRecordResponse(MedicalRecordBase):
    id: UUID
    tenant_id: UUID
    createdById: UUID
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class MedicalRecordStatsResponse(BaseModel):
    total: int
    byType: Dict[str, int]

class MedicalSupplyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    unit: Optional[str] = Field(default="piece", max_length=50)
    stockQuantity: Optional[int] = Field(default=0, ge=0)
    minStockLevel: Optional[int] = Field(default=0, ge=0)
    maxStockLevel: Optional[int] = Field(None, ge=0)
    unitPrice: Optional[float] = Field(default=0.0, ge=0)
    expiryDate: Optional[date] = None
    batchNumber: Optional[str] = None
    supplier: Optional[str] = None
    location: Optional[str] = None

class MedicalSupplyCreate(MedicalSupplyBase):
    pass

class MedicalSupplyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    unit: Optional[str] = Field(None, max_length=50)
    stockQuantity: Optional[int] = Field(None, ge=0)
    minStockLevel: Optional[int] = Field(None, ge=0)
    maxStockLevel: Optional[int] = Field(None, ge=0)
    unitPrice: Optional[float] = Field(None, ge=0)
    expiryDate: Optional[date] = None
    batchNumber: Optional[str] = None
    supplier: Optional[str] = None
    location: Optional[str] = None

class MedicalSupplyResponse(MedicalSupplyBase):
    id: UUID
    supplyId: str
    tenant_id: UUID
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class MedicalSupplyStatsResponse(BaseModel):
    total: int
    lowStock: int
    byCategory: Dict[str, int]
    totalValue: float

class ConsultationBase(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    consultationDate: date
    consultationTime: str
    doctorId: UUID
    chiefComplaint: Optional[str] = None
    historyOfPresentIllness: Optional[str] = None
    physicalExamination: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    prescriptions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    followUpDate: Optional[date] = None
    followUpNotes: Optional[str] = None
    vitalSigns: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ConsultationCreate(ConsultationBase):
    pass

class ConsultationUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    consultationDate: Optional[date] = None
    consultationTime: Optional[str] = None
    doctorId: Optional[UUID] = None
    chiefComplaint: Optional[str] = None
    historyOfPresentIllness: Optional[str] = None
    physicalExamination: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    prescriptions: Optional[List[Dict[str, Any]]] = None
    followUpDate: Optional[date] = None
    followUpNotes: Optional[str] = None
    vitalSigns: Optional[Dict[str, Any]] = None

class ConsultationResponse(ConsultationBase):
    id: UUID
    tenant_id: UUID
    createdById: UUID
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class ConsultationStatsResponse(BaseModel):
    total: int
    today: int
    thisMonth: int

class TestResult(BaseModel):
    testName: str
    value: str
    unit: Optional[str] = None
    referenceRange: Optional[str] = None
    status: Optional[str] = None

class LabReportBase(BaseModel):
    patient_id: UUID
    appointment_id: Optional[UUID] = None
    reportNumber: str = Field(..., min_length=1, max_length=100)
    reportDate: date
    orderedBy: UUID
    testName: str = Field(..., min_length=1, max_length=200)
    testCategory: Optional[str] = None
    testResults: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    labName: Optional[str] = None
    labAddress: Optional[str] = None
    technicianName: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[str]] = Field(default_factory=list)
    isVerified: Optional[bool] = Field(default=False)

class LabReportCreate(LabReportBase):
    pass

class LabReportUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    reportNumber: Optional[str] = Field(None, min_length=1, max_length=100)
    reportDate: Optional[date] = None
    orderedBy: Optional[UUID] = None
    testName: Optional[str] = Field(None, min_length=1, max_length=200)
    testCategory: Optional[str] = None
    testResults: Optional[List[Dict[str, Any]]] = None
    labName: Optional[str] = None
    labAddress: Optional[str] = None
    technicianName: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[str]] = None
    isVerified: Optional[bool] = None

class LabReportResponse(LabReportBase):
    id: UUID
    tenant_id: UUID
    verifiedBy: Optional[UUID] = None
    verifiedAt: Optional[datetime] = None
    createdById: UUID
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

class LabReportStatsResponse(BaseModel):
    total: int
    verified: int
    unverified: int
    today: int
    byCategory: Dict[str, int]

