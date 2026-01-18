import { apiService } from './ApiService';
import {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentStats,
  AppointmentsResponse,
} from '../models/healthcare';

class AppointmentService {
  private baseUrl = '/appointments';

  async getAppointments(
    skip: number = 0,
    limit: number = 100,
    patient_id?: string,
    doctor_id?: string,
    status?: string,
    date_from?: string,
    date_to?: string,
  ): Promise<AppointmentsResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (patient_id) params.append('patient_id', patient_id);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (status) params.append('status', status);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async createAppointment(appointmentData: AppointmentCreate): Promise<Appointment> {
    const response = await apiService.post(this.baseUrl, appointmentData);
    return response;
  }

  async updateAppointment(id: string, appointmentData: AppointmentUpdate): Promise<Appointment> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, appointmentData);
    return response;
  }

  async deleteAppointment(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  async getAppointmentStats(): Promise<AppointmentStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }
}

export default new AppointmentService();
