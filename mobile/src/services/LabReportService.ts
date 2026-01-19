import { apiService } from './ApiService';
import {
  LabReport,
  LabReportCreate,
  LabReportUpdate,
  LabReportStats,
  LabReportsResponse,
} from '../models/healthcare';

class LabReportService {
  private baseUrl = '/lab-reports';

  async getLabReports(
    skip: number = 0,
    limit: number = 100,
    patient_id?: string,
    doctor_id?: string,
    test_category?: string,
    date_from?: string,
    date_to?: string,
    is_verified?: boolean,
  ): Promise<LabReportsResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (patient_id) params.append('patient_id', patient_id);
    if (doctor_id) params.append('doctor_id', doctor_id);
    if (test_category) params.append('test_category', test_category);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    if (is_verified !== undefined) params.append('is_verified', is_verified.toString());

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getLabReportById(id: string): Promise<LabReport> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async createLabReport(labReportData: LabReportCreate): Promise<LabReport> {
    const response = await apiService.post(this.baseUrl, labReportData);
    return response;
  }

  async updateLabReport(id: string, labReportData: LabReportUpdate): Promise<LabReport> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, labReportData);
    return response;
  }

  async deleteLabReport(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  async verifyLabReport(id: string): Promise<LabReport> {
    const response = await apiService.post(`${this.baseUrl}/${id}/verify`, {});
    return response;
  }

  async getLabReportStats(): Promise<LabReportStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }
}

export default new LabReportService();
