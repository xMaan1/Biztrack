import { apiService } from './ApiService';
import {
  Quote,
  QuoteCreate,
  QuoteUpdate,
  QuotesResponse,
  Contract,
  ContractCreate,
  ContractUpdate,
  ContractsResponse,
} from '../models/sales';

class SalesService {
  private baseUrl = '/sales';

  async getQuotes(
    filters?: {
      status?: string;
      opportunityId?: string;
      page?: number;
      limit?: number;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<QuotesResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.opportunityId) params.append('opportunity_id', filters.opportunityId);
      params.append('page', (filters?.page || page).toString());
      params.append('limit', (filters?.limit || limit).toString());

      const url = `${this.baseUrl}/quotes?${params.toString()}`;

      const response = await apiService.get(url);
      
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async getQuote(id: string): Promise<Quote> {
    const response = await apiService.get(`${this.baseUrl}/quotes/${id}`);
    return response.quote || response;
  }

  async createQuote(quoteData: QuoteCreate): Promise<Quote> {
    try {
      console.log('[SalesService] Creating quote with data:', JSON.stringify(quoteData, null, 2));
      console.log('[SalesService] Quote data keys:', Object.keys(quoteData));
      console.log('[SalesService] Items count:', quoteData.items?.length || 0);
      console.log('[SalesService] Items:', JSON.stringify(quoteData.items, null, 2));
      
      const url = `${this.baseUrl}/quotes`;
      console.log('[SalesService] POST URL:', url);
      
      const response = await apiService.post(url, quoteData);
      
      console.log('[SalesService] Quote creation response:', JSON.stringify(response, null, 2));
      console.log('[SalesService] Response keys:', Object.keys(response || {}));
      
      return response.quote || response;
    } catch (error: any) {
      console.error('[SalesService] Error creating quote:', error);
      console.error('[SalesService] Error message:', error.message);
      console.error('[SalesService] Error response status:', error.response?.status);
      console.error('[SalesService] Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[SalesService] Error config URL:', error.config?.url);
      console.error('[SalesService] Error config method:', error.config?.method);
      throw error;
    }
  }

  async updateQuote(id: string, quoteData: QuoteUpdate): Promise<Quote> {
    const response = await apiService.put(`${this.baseUrl}/quotes/${id}`, quoteData);
    return response.quote || response;
  }

  async deleteQuote(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/quotes/${id}`);
  }

  async sendQuote(id: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/quotes/${id}/send`);
  }

  async getContracts(
    filters?: {
      status?: string;
      opportunityId?: string;
      page?: number;
      limit?: number;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<ContractsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.opportunityId) params.append('opportunity_id', filters.opportunityId);
    params.append('page', (filters?.page || page).toString());
    params.append('limit', (filters?.limit || limit).toString());

    const response = await apiService.get(`${this.baseUrl}/contracts?${params.toString()}`);
    return response;
  }

  async getContract(id: string): Promise<Contract> {
    const response = await apiService.get(`${this.baseUrl}/contracts/${id}`);
    return response.contract || response;
  }

  async createContract(contractData: ContractCreate): Promise<Contract> {
    const response = await apiService.post(`${this.baseUrl}/contracts`, contractData);
    return response.contract || response;
  }

  async updateContract(id: string, contractData: ContractUpdate): Promise<Contract> {
    const response = await apiService.put(`${this.baseUrl}/contracts/${id}`, contractData);
    return response.contract || response;
  }

  async deleteContract(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/contracts/${id}`);
  }

  getQuoteStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  getContractStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      pending_signature: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-orange-100 text-orange-800',
      terminated: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async getDashboard(): Promise<any> {
    return apiService.get(`${this.baseUrl}/dashboard`);
  }
}

export default new SalesService();
