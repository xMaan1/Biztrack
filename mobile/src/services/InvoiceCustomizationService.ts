import { apiService } from './ApiService';

export interface InvoiceCustomization {
  id?: string;
  tenant_id?: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  company_logo_url?: string;
  tax_id?: string;
  registration_number?: string;
  payment_instructions?: string;
  default_currency?: string;
  invoice_prefix?: string;
  invoice_number_format?: string;
  terms_and_conditions?: string;
  footer_text?: string;
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

class InvoiceCustomizationService {
  private baseUrl = '/invoice-customization';

  async getCustomization(): Promise<InvoiceCustomization> {
    const response = await apiService.get(`${this.baseUrl}/`);
    return response.customization;
  }

  async createCustomization(
    customizationData: Partial<InvoiceCustomization>,
  ): Promise<InvoiceCustomization> {
    const response = await apiService.post(`${this.baseUrl}/`, customizationData);
    return response.customization;
  }

  async updateCustomization(
    customizationData: Partial<InvoiceCustomization>,
  ): Promise<InvoiceCustomization> {
    const response = await apiService.put(`${this.baseUrl}/`, customizationData);
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
}

export default new InvoiceCustomizationService();

