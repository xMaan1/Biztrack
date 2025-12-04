import { apiService } from './ApiService';
import {
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientStats,
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentStats,
  MedicalRecord,
  MedicalRecordCreate,
  MedicalRecordUpdate,
  MedicalRecordStats,
  MedicalSupply,
  MedicalSupplyCreate,
  MedicalSupplyUpdate,
  MedicalSupplyStats,
} from '../models/healthcare';

export class PatientService {
  private baseUrl = '/patients';

  async getPatients(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    status?: string,
  ): Promise<{ patients: Patient[]; total: number }> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    return apiService.get(`${this.baseUrl}?${params.toString()}`);
  }

  async getPatient(id: string): Promise<Patient> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createPatient(patient: PatientCreate): Promise<Patient> {
    return apiService.post(this.baseUrl, patient);
  }

  async updatePatient(id: string, patient: PatientUpdate): Promise<Patient> {
    return apiService.put(`${this.baseUrl}/${id}`, patient);
  }

  async deletePatient(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getPatientStats(): Promise<PatientStats> {
    return apiService.get(`${this.baseUrl}/stats`);
  }
}

export class AppointmentService {
  private baseUrl = '/appointments';

  async getAppointments(
    skip: number = 0,
    limit: number = 100,
    patient_id?: string,
    doctor_id?: string,
    status?: string,
    date_from?: string,
    date_to?: string,
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (patient_id) params.append('patient_id', patient_id);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (status) params.append('status', status);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);

    return apiService.get(`${this.baseUrl}?${params.toString()}`);
  }

  async getAppointment(id: string): Promise<Appointment> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createAppointment(appointment: AppointmentCreate): Promise<Appointment> {
    return apiService.post(this.baseUrl, appointment);
  }

  async updateAppointment(id: string, appointment: AppointmentUpdate): Promise<Appointment> {
    return apiService.put(`${this.baseUrl}/${id}`, appointment);
  }

  async deleteAppointment(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getAppointmentStats(): Promise<AppointmentStats> {
    return apiService.get(`${this.baseUrl}/stats`);
  }
}

export class MedicalRecordService {
  private baseUrl = '/medical-records';

  async getMedicalRecords(
    skip: number = 0,
    limit: number = 100,
    patient_id?: string,
    record_type?: string,
    doctor_id?: string,
    date_from?: string,
    date_to?: string,
  ): Promise<{ records: MedicalRecord[]; total: number }> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (patient_id) params.append('patient_id', patient_id);
    if (record_type) params.append('record_type', record_type);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);

    return apiService.get(`${this.baseUrl}?${params.toString()}`);
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createMedicalRecord(record: MedicalRecordCreate): Promise<MedicalRecord> {
    return apiService.post(this.baseUrl, record);
  }

  async updateMedicalRecord(id: string, record: MedicalRecordUpdate): Promise<MedicalRecord> {
    return apiService.put(`${this.baseUrl}/${id}`, record);
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getMedicalRecordStats(): Promise<MedicalRecordStats> {
    return apiService.get(`${this.baseUrl}/stats`);
  }
}

export class MedicalSupplyService {
  private baseUrl = '/medical-supplies';

  async getMedicalSupplies(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    category?: string,
    low_stock?: boolean,
  ): Promise<{ supplies: MedicalSupply[]; total: number }> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (low_stock !== undefined) params.append('low_stock', low_stock.toString());

    return apiService.get(`${this.baseUrl}?${params.toString()}`);
  }

  async getMedicalSupply(id: string): Promise<MedicalSupply> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createMedicalSupply(supply: MedicalSupplyCreate): Promise<MedicalSupply> {
    return apiService.post(this.baseUrl, supply);
  }

  async updateMedicalSupply(id: string, supply: MedicalSupplyUpdate): Promise<MedicalSupply> {
    return apiService.put(`${this.baseUrl}/${id}`, supply);
  }

  async deleteMedicalSupply(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getMedicalSupplyStats(): Promise<MedicalSupplyStats> {
    return apiService.get(`${this.baseUrl}/stats`);
  }
}

export const patientService = new PatientService();
export const appointmentService = new AppointmentService();
export const medicalRecordService = new MedicalRecordService();
export const medicalSupplyService = new MedicalSupplyService();

