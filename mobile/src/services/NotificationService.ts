import { apiService } from './ApiService';
import {
  Notification,
  NotificationListResponse,
  NotificationPreferencesResponse,
  NotificationPreferenceUpdate,
  UnreadCountResponse,
  NotificationFilters,
} from '@/models/notifications';

class NotificationService {
  private baseUrl = '/notifications';

  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationListResponse> {
    const params: string[] = [];
    
    if (filters.page) params.push(`page=${filters.page}`);
    if (filters.limit) params.push(`limit=${filters.limit}`);
    if (filters.is_read !== undefined) params.push(`is_read=${filters.is_read}`);
    if (filters.category) params.push(`category=${filters.category}`);
    if (filters.type) params.push(`type=${filters.type}`);

    const queryString = params.join('&');
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return apiService.get(url);
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiService.get(`${this.baseUrl}/unread-count`);
  }

  async markAsRead(notificationId: string): Promise<{ message: string }> {
    return apiService.put(`${this.baseUrl}/${notificationId}/read`);
  }

  async markAsUnread(notificationId: string): Promise<{ message: string }> {
    return apiService.put(`${this.baseUrl}/${notificationId}/unread`);
  }

  async markAllAsRead(): Promise<{ message: string }> {
    return apiService.post(`${this.baseUrl}/mark-all-read`);
  }

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    return apiService.delete(`${this.baseUrl}/${notificationId}`);
  }

  async getNotificationPreferences(): Promise<NotificationPreferencesResponse> {
    return apiService.get(`${this.baseUrl}/preferences`);
  }

  async updateNotificationPreference(preference: NotificationPreferenceUpdate): Promise<{ message: string }> {
    return apiService.put(`${this.baseUrl}/preferences`, preference);
  }

  async getUnreadNotifications(limit: number = 10): Promise<Notification[]> {
    const response = await this.getNotifications({
      is_read: false,
      limit,
      page: 1,
    });
    return response.notifications;
  }

  async getNotificationsByCategory(category: string, limit: number = 50): Promise<Notification[]> {
    const response = await this.getNotifications({
      category: category as any,
      limit,
      page: 1,
    });
    return response.notifications;
  }

  async getRecentNotifications(limit: number = 20): Promise<Notification[]> {
    const response = await this.getNotifications({
      limit,
      page: 1,
    });
    return response.notifications;
  }
}

export default new NotificationService();


