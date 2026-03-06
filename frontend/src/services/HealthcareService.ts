import { ApiService } from './ApiService';
import type {
  Doctor,
  DoctorCreate,
  DoctorUpdate,
  DoctorsResponse,
  HealthcareStaff,
  HealthcareStaffCreate,
  HealthcareStaffUpdate,
  HealthcareStaffResponse,
} from '../models/healthcare';

export class HealthcareService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  async getDoctors(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DoctorsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined)
      searchParams.set('is_active', String(params.is_active));
    searchParams.set('page', String(params?.page ?? 1));
    searchParams.set('limit', String(params?.limit ?? 20));
    return this.apiService.get<DoctorsResponse>(
      `/healthcare/doctors?${searchParams.toString()}`
    );
  }

  async getDoctor(id: string): Promise<Doctor> {
    return this.apiService.get<Doctor>(`/healthcare/doctors/${id}`);
  }

  async createDoctor(data: DoctorCreate): Promise<Doctor> {
    return this.apiService.post<Doctor>('/healthcare/doctors', data);
  }

  async updateDoctor(id: string, data: DoctorUpdate): Promise<Doctor> {
    return this.apiService.put<Doctor>(`/healthcare/doctors/${id}`, data);
  }

  async deleteDoctor(id: string): Promise<void> {
    return this.apiService.delete(`/healthcare/doctors/${id}`);
  }

  async getStaff(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<HealthcareStaffResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
    searchParams.set('page', String(params?.page ?? 1));
    searchParams.set('limit', String(params?.limit ?? 20));
    return this.apiService.get<HealthcareStaffResponse>(
      `/healthcare/staff?${searchParams.toString()}`
    );
  }

  async createStaff(data: HealthcareStaffCreate): Promise<HealthcareStaff> {
    return this.apiService.post<HealthcareStaff>('/healthcare/staff', data);
  }

  async updateStaff(id: string, data: HealthcareStaffUpdate): Promise<HealthcareStaff> {
    return this.apiService.put<HealthcareStaff>(`/healthcare/staff/${id}`, data);
  }

  async deleteStaff(id: string): Promise<void> {
    return this.apiService.delete(`/healthcare/staff/${id}`);
  }
}

const healthcareService = new HealthcareService();
export default healthcareService;
