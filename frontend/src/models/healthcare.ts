export interface Patient {
  id: string;
  patientId: string;
  tenant_id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  notes?: string;
  status?: 'active' | 'inactive';
  assignedToId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCreate {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  notes?: string;
  status?: 'active' | 'inactive';
  assignedToId?: string;
}

export interface PatientUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  notes?: string;
  status?: 'active' | 'inactive';
  assignedToId?: string;
}

export interface PatientStats {
  total: number;
  active: number;
  inactive: number;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  doctorId?: string;
  createdById: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentCreate {
  patient_id: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  type: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  doctorId?: string;
}

export interface AppointmentUpdate {
  patient_id?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  type?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  doctorId?: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
}

export interface MedicalRecord {
  id: string;
  tenant_id: string;
  patient_id: string;
  recordType: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  vitalSigns?: Record<string, any>;
  labResults?: Record<string, any>;
  attachments?: string[];
  visitDate: string;
  doctorId?: string;
  createdById: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordCreate {
  patient_id: string;
  recordType: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  vitalSigns?: Record<string, any>;
  labResults?: Record<string, any>;
  attachments?: string[];
  visitDate: string;
  doctorId?: string;
  isConfidential?: boolean;
}

export interface MedicalRecordUpdate {
  patient_id?: string;
  recordType?: string;
  title?: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  vitalSigns?: Record<string, any>;
  labResults?: Record<string, any>;
  attachments?: string[];
  visitDate?: string;
  doctorId?: string;
  isConfidential?: boolean;
}

export interface MedicalRecordStats {
  total: number;
  byType: Record<string, number>;
}

export interface MedicalSupply {
  id: string;
  supplyId: string;
  tenant_id: string;
  name: string;
  category?: string;
  description?: string;
  unit?: string;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitPrice: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalSupplyCreate {
  name: string;
  category?: string;
  description?: string;
  unit?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unitPrice?: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
}

export interface MedicalSupplyUpdate {
  name?: string;
  category?: string;
  description?: string;
  unit?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unitPrice?: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
}

export interface MedicalSupplyStats {
  total: number;
  lowStock: number;
  byCategory: Record<string, number>;
  totalValue: number;
}

export interface Consultation {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointment_id?: string;
  consultationDate: string;
  consultationTime: string;
  doctorId: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  prescriptions?: Array<Record<string, any>>;
  followUpDate?: string;
  followUpNotes?: string;
  vitalSigns?: Record<string, any>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationCreate {
  patient_id: string;
  appointment_id?: string;
  consultationDate: string;
  consultationTime: string;
  doctorId: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  prescriptions?: Array<Record<string, any>>;
  followUpDate?: string;
  followUpNotes?: string;
  vitalSigns?: Record<string, any>;
}

export interface ConsultationUpdate {
  patient_id?: string;
  appointment_id?: string;
  consultationDate?: string;
  consultationTime?: string;
  doctorId?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  prescriptions?: Array<Record<string, any>>;
  followUpDate?: string;
  followUpNotes?: string;
  vitalSigns?: Record<string, any>;
}

export interface ConsultationStats {
  total: number;
  today: number;
  thisMonth: number;
}

export interface TestResult {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
}

export interface LabReport {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointment_id?: string;
  reportNumber: string;
  reportDate: string;
  orderedBy: string;
  testName: string;
  testCategory?: string;
  testResults?: Array<Record<string, any>>;
  labName?: string;
  labAddress?: string;
  technicianName?: string;
  notes?: string;
  attachments?: string[];
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabReportCreate {
  patient_id: string;
  appointment_id?: string;
  reportNumber: string;
  reportDate: string;
  orderedBy: string;
  testName: string;
  testCategory?: string;
  testResults?: Array<Record<string, any>>;
  labName?: string;
  labAddress?: string;
  technicianName?: string;
  notes?: string;
  attachments?: string[];
  isVerified?: boolean;
}

export interface LabReportUpdate {
  patient_id?: string;
  appointment_id?: string;
  reportNumber?: string;
  reportDate?: string;
  orderedBy?: string;
  testName?: string;
  testCategory?: string;
  testResults?: Array<Record<string, any>>;
  labName?: string;
  labAddress?: string;
  technicianName?: string;
  notes?: string;
  attachments?: string[];
  isVerified?: boolean;
}

export interface LabReportStats {
  total: number;
  verified: number;
  unverified: number;
  today: number;
  byCategory: Record<string, number>;
}

