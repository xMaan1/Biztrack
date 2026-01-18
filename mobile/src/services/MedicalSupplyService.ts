import { apiService } from './ApiService';
import {
  MedicalSupply,
  MedicalSupplyCreate,
  MedicalSupplyUpdate,
  MedicalSupplyStats,
  MedicalSuppliesResponse,
} from '../models/healthcare';

class MedicalSupplyService {
  private baseUrl = '/medical-supplies';

  async getMedicalSupplies(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    category?: string,
    low_stock?: boolean,
  ): Promise<MedicalSuppliesResponse> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (low_stock !== undefined) params.append('low_stock', low_stock.toString());

    const response = await apiService.get(`${this.baseUrl}?${params.toString()}`);
    return response;
  }

  async getMedicalSupply(id: string): Promise<MedicalSupply> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async createMedicalSupply(supplyData: MedicalSupplyCreate): Promise<MedicalSupply> {
    const response = await apiService.post(this.baseUrl, supplyData);
    return response;
  }

  async updateMedicalSupply(
    id: string,
    supplyData: MedicalSupplyUpdate,
  ): Promise<MedicalSupply> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, supplyData);
    return response;
  }

  async deleteMedicalSupply(id: string): Promise<{ message: string }> {
    const response = await apiService.delete(`${this.baseUrl}/${id}`);
    return response;
  }

  async getMedicalSupplyStats(): Promise<MedicalSupplyStats> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }
}

export default new MedicalSupplyService();
