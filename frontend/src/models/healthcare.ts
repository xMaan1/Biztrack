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

