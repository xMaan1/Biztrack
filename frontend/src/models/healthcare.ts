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

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
