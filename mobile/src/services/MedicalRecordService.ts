import { apiService } from './ApiService';
import {
  MedicalRecord,
  MedicalRecordCreate,
  MedicalRecordUpdate,
  MedicalRecordStats,
  MedicalRecordsResponse,
} from '../models/healthcare';

class MedicalRecordService {
  private baseUrl = '/medical-records';

  async getMedicalRecords(
    skip: number = 0,
    limit: number = 100,
    patient_id?: string,
    record_type?: string,
    doctor_id?: string,
    date_from?: string,
    date_to?: string,
  ): Promise<MedicalRecordsResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (patient_id) params.append('patient_id', patient_id);
    if (record_type) params.append('record_type', record_type);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async createMedicalRecord(recordData: MedicalRecordCreate): Promise<MedicalRecord> {
    const response = await apiService.post(this.baseUrl, recordData);
    return response;
  }

  async updateMedicalRecord(id: string, recordData: MedicalRecordUpdate): Promise<MedicalRecord> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, recordData);
    return response;
  }

  async deleteMedicalRecord(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  async getMedicalRecordStats(): Promise<MedicalRecordStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }
}

export default new MedicalRecordService();
