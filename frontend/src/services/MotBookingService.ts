import { apiService } from './ApiService';
import type {
  MotBooking,
  MotBookingCreate,
  MotBookingUpdate,
  MotBookingStatusUpdate,
  MotBookingsResponse,
  MotBookingStats,
} from '../models/workshop/MotBooking';

export class MotBookingService {
  private baseUrl = '/workshop/mot-bookings';

  async getStats(): Promise<MotBookingStats> {
    return apiService.get(`${this.baseUrl}/stats`);
  }

  async getBookings(params?: {
    status?: string;
    test_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MotBookingsResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.test_type && params.test_type !== 'all') query.set('test_type', params.test_type);
    if (params?.date_from) query.set('date_from', params.date_from);
    if (params?.date_to) query.set('date_to', params.date_to);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiService.get(qs ? `${this.baseUrl}?${qs}` : this.baseUrl);
  }

  async getCalendar(dateFrom: string, dateTo: string): Promise<MotBookingsResponse> {
    return apiService.get(
      `${this.baseUrl}/calendar?date_from=${dateFrom}&date_to=${dateTo}`,
    );
  }

  async getBooking(id: string): Promise<MotBooking> {
    return apiService.get(`${this.baseUrl}/${id}`);
  }

  async createBooking(data: MotBookingCreate): Promise<MotBooking> {
    return apiService.post(this.baseUrl, data);
  }

  async updateBooking(id: string, data: MotBookingUpdate): Promise<MotBooking> {
    return apiService.put(`${this.baseUrl}/${id}`, data);
  }

  async updateBookingStatus(id: string, data: MotBookingStatusUpdate): Promise<MotBooking> {
    return apiService.patch(`${this.baseUrl}/${id}/status`, data);
  }

  async deleteBooking(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }
}

export const motBookingService = new MotBookingService();
export default motBookingService;
