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

export interface PatientsResponse {
  patients: Patient[];
  total: number;
}
