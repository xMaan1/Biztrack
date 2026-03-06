export interface DoctorAvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
}

export interface Doctor {
  id: string;
  tenant_id: string;
  pmdc_number: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  availability: DoctorAvailabilitySlot[];
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorCreate {
  pmdc_number: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  availability: DoctorAvailabilitySlot[];
}

export interface DoctorUpdate {
  pmdc_number?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  specialization?: string;
  qualification?: string;
  address?: string;
  availability?: DoctorAvailabilitySlot[];
  is_active?: boolean;
}

export interface DoctorsResponse {
  doctors: Doctor[];
  total: number;
}

export const HEALTHCARE_PERMISSIONS = [
  'healthcare:view',
  'healthcare:create',
  'healthcare:update',
  'healthcare:delete',
] as const;

export type HealthcarePermission = (typeof HEALTHCARE_PERMISSIONS)[number];

export interface HealthcareStaff {
  id: string;
  tenant_id: string;
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  permissions: HealthcarePermission[] | string[];
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HealthcareStaffCreate {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  permissions: HealthcarePermission[] | string[];
}

export interface HealthcareStaffUpdate {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  permissions?: HealthcarePermission[] | string[];
  is_active?: boolean;
}

export interface HealthcareStaffResponse {
  staff: HealthcareStaff[];
  total: number;
}

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
