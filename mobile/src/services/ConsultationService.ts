import { apiService } from './ApiService';
import {
  Consultation,
  ConsultationCreate,
  ConsultationUpdate,
  ConsultationStats,
  ConsultationsResponse,
} from '../models/healthcare';

class ConsultationService {
  private baseUrl = '/consultations';

  async getConsultations(
    skip: number = 0,
    limit: number = 100,
    patient_id?: string,
    doctor_id?: string,
    date_from?: string,
    date_to?: string,
  ): Promise<ConsultationsResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (patient_id) params.append('patient_id', patient_id);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getConsultationById(id: string): Promise<Consultation> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async createConsultation(consultationData: ConsultationCreate): Promise<Consultation> {
    const response = await apiService.post(this.baseUrl, consultationData);
    return response;
  }

  async updateConsultation(id: string, consultationData: ConsultationUpdate): Promise<Consultation> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, consultationData);
    return response;
  }

  async deleteConsultation(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  async getConsultationStats(): Promise<ConsultationStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }
}

export default new ConsultationService();
