import { apiService } from './ApiService';
import type {
  MotRetailer,
  MotRetailerCreate,
  MotRetailerUpdate,
  MotRetailersResponse,
} from '../models/mot/MotRetailer';

export class MotRetailerService {
  private publicBaseUrl = '/public/mot/retailers';
  private adminBaseUrl = '/mot/retailers';

  async getRetailers(): Promise<MotRetailersResponse> {
    return apiService.get(this.publicBaseUrl);
  }

  async createRetailer(data: MotRetailerCreate): Promise<MotRetailer> {
    return apiService.post(this.adminBaseUrl, data);
  }

  async updateRetailer(id: string, data: MotRetailerUpdate): Promise<MotRetailer> {
    return apiService.put(`${this.adminBaseUrl}/${id}`, data);
  }

  async setDefaultRetailer(id: string): Promise<MotRetailer> {
    return apiService.post(`${this.adminBaseUrl}/${id}/set-default`);
  }

  async deleteRetailer(id: string): Promise<void> {
    return apiService.delete(`${this.adminBaseUrl}/${id}`);
  }
}

export const motRetailerService = new MotRetailerService();
export default motRetailerService;
