import { apiService } from './ApiService';
import {
  Patient,
  PatientCreate,
  PatientUpdate,
  PatientStats,
  PatientsResponse,
} from '../models/healthcare';

class PatientService {
  private baseUrl = '/patients';

  async getPatients(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    status?: string,
  ): Promise<PatientsResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getPatientById(id: string): Promise<Patient> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async createPatient(patientData: PatientCreate): Promise<Patient> {
    const response = await apiService.post(this.baseUrl, patientData);
    return response;
  }

  async updatePatient(id: string, patientData: PatientUpdate): Promise<Patient> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, patientData);
    return response;
  }

  async deletePatient(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  async getPatientStats(): Promise<PatientStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  async searchPatients(query: string, limit: number = 20): Promise<Patient[]> {
    const response = await apiService.get(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return response;
  }
}

export default new PatientService();
