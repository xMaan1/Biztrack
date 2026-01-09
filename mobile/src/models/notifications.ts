export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system',
}

export enum NotificationCategory {
  HRM = 'hrm',
  INVENTORY = 'inventory',
  CRM = 'crm',
  PRODUCTION = 'production',
  QUALITY = 'quality',
  MAINTENANCE = 'maintenance',
  LEDGER = 'ledger',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  notification_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreate {
  userId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  actionUrl?: string;
  notification_data?: Record<string, any>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  is_read?: boolean;
  category?: NotificationCategory;
  type?: NotificationType;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

export interface NotificationPreference {
  id: string;
  tenant_id: string;
  user_id: string;
  category: NotificationCategory;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  category: NotificationCategory;
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
}

export interface UnreadCountResponse {
  unread_count: number;
}
