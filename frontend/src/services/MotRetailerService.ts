import { apiService } from './ApiService';
import type {
  MotRetailer,
  MotRetailerCreate,
  MotRetailerUpdate,
  MotRetailersResponse,
} from '../models/workshop/MotRetailer';

export class MotRetailerService {
  private baseUrl = '/workshop/mot-retailers';

  async getRetailers(): Promise<MotRetailersResponse> {
    return apiService.get(this.baseUrl);
  }

  async createRetailer(data: MotRetailerCreate): Promise<MotRetailer> {
    return apiService.post(this.baseUrl, data);
  }

  async updateRetailer(id: string, data: MotRetailerUpdate): Promise<MotRetailer> {
    return apiService.put(`${this.baseUrl}/${id}`, data);
  }

  async setDefaultRetailer(id: string): Promise<MotRetailer> {
    return apiService.post(`${this.baseUrl}/${id}/set-default`);
  }

  async deleteRetailer(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }
}

export const motRetailerService = new MotRetailerService();
export default motRetailerService;
