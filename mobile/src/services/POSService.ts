import { apiService } from './ApiService';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductsResponse,
  ProductResponse,
  POSTransaction,
  POSTransactionCreate,
  POSTransactionUpdate,
  POSTransactionsResponse,
  POSTransactionResponse,
  POSShift,
  POSShiftCreate,
  POSShiftUpdate,
  POSShiftsResponse,
  POSShiftResponse,
  POSDashboard,
  ProductFilters,
  POSTransactionFilters,
  POSShiftFilters,
} from '../models/pos';

class POSService {
  private baseUrl = '/pos';

  async getDashboard(): Promise<POSDashboard> {
    return apiService.get(`${this.baseUrl}/dashboard`);
  }

  async getProducts(
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 100,
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.lowStock) params.append('low_stock', 'true');
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/products?${params.toString()}`);
  }

  async searchProducts(query: string): Promise<ProductsResponse> {
    return apiService.get(`${this.baseUrl}/products/search?q=${encodeURIComponent(query)}`);
  }

  async getProduct(id: string): Promise<Product> {
    const response = await apiService.get<ProductResponse>(`${this.baseUrl}/products/${id}`);
    return response.product;
  }

  async createProduct(product: ProductCreate): Promise<Product> {
    const response = await apiService.post<ProductResponse>(`${this.baseUrl}/products`, product);
    return response.product;
  }

  async updateProduct(id: string, product: ProductUpdate): Promise<Product> {
    const response = await apiService.put<ProductResponse>(`${this.baseUrl}/products/${id}`, product);
    return response.product;
  }

  async deleteProduct(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/products/${id}`);
  }

  async getTransactions(
    filters?: POSTransactionFilters,
    page: number = 1,
    limit: number = 100,
  ): Promise<POSTransactionsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentMethod) params.append('payment_method', filters.paymentMethod);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/transactions?${params.toString()}`);
  }

  async getTransaction(id: string): Promise<POSTransaction> {
    const response = await apiService.get<POSTransactionResponse>(`${this.baseUrl}/transactions/${id}`);
    return response.transaction;
  }

  async createTransaction(transaction: POSTransactionCreate): Promise<POSTransaction> {
    const response = await apiService.post<POSTransactionResponse>(`${this.baseUrl}/transactions`, transaction);
    return response.transaction;
  }

  async updateTransaction(id: string, transaction: POSTransactionUpdate): Promise<POSTransaction> {
    const response = await apiService.put<POSTransactionResponse>(`${this.baseUrl}/transactions/${id}`, transaction);
    return response.transaction;
  }

  async getShifts(
    filters?: POSShiftFilters,
    page: number = 1,
    limit: number = 100,
  ): Promise<POSShiftsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.cashierId) params.append('cashier_id', filters.cashierId);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return apiService.get(`${this.baseUrl}/shifts?${params.toString()}`);
  }

  async getCurrentOpenShift(): Promise<POSShift | null> {
    try {
      const response = await apiService.get<POSShiftResponse>(`${this.baseUrl}/shifts/current/open`);
      return response.shift;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getShift(id: string): Promise<POSShift> {
    const response = await apiService.get<POSShiftResponse>(`${this.baseUrl}/shifts/${id}`);
    return response.shift;
  }

  async createShift(shift: POSShiftCreate): Promise<POSShift> {
    const response = await apiService.post<POSShiftResponse>(`${this.baseUrl}/shifts`, shift);
    return response.shift;
  }

  async updateShift(id: string, shift: POSShiftUpdate): Promise<POSShift> {
    const response = await apiService.put<POSShiftResponse>(`${this.baseUrl}/shifts/${id}`, shift);
    return response.shift;
  }

  async getSalesReport(filters?: {
    dateFrom?: string;
    dateTo?: string;
    paymentMethod?: string;
    cashierId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.paymentMethod) params.append('payment_method', filters.paymentMethod);
    if (filters?.cashierId) params.append('cashier_id', filters.cashierId);

    return apiService.get(`${this.baseUrl}/reports/sales?${params.toString()}`);
  }

  async getInventoryReport(filters?: {
    category?: string;
    lowStockOnly?: boolean;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.lowStockOnly) params.append('low_stock_only', 'true');

    return apiService.get(`${this.baseUrl}/reports/inventory?${params.toString()}`);
  }

  async getShiftsReport(filters?: {
    dateFrom?: string;
    dateTo?: string;
    cashierId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.cashierId) params.append('cashier_id', filters.cashierId);

    return apiService.get(`${this.baseUrl}/reports/shifts?${params.toString()}`);
  }
}

export default new POSService();
