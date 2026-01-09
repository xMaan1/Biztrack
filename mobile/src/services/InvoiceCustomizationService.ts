import { apiService } from './ApiService';
import {
  InvoiceCustomization,
  InvoiceCustomizationCreate,
  InvoiceCustomizationUpdate,
  InvoiceCustomizationResponse,
} from '@/models/invoiceCustomization';

class InvoiceCustomizationService {
  private baseUrl = '/invoice-customization';

  async getCustomization(): Promise<InvoiceCustomization> {
    const response = await apiService.get<InvoiceCustomizationResponse>(`${this.baseUrl}/`);
    return response.customization;
  }

  async createCustomization(
    customizationData: InvoiceCustomizationCreate,
  ): Promise<InvoiceCustomization> {
    const response = await apiService.post<InvoiceCustomizationResponse>(
      `${this.baseUrl}/`,
      customizationData,
    );
    return response.customization;
  }

  async updateCustomization(
    customizationData: InvoiceCustomizationUpdate,
  ): Promise<InvoiceCustomization> {
    const response = await apiService.put<InvoiceCustomizationResponse>(
      `${this.baseUrl}/`,
      customizationData,
    );
    return response.customization;
  }

  async deleteCustomization(): Promise<void> {
    await apiService.delete(`${this.baseUrl}/`);
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export default new InvoiceCustomizationService();
