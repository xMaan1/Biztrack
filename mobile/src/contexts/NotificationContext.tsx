import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import NotificationService from '@/services/NotificationService';
import {
  Notification,
  NotificationFilters,
  NotificationPreference,
  NotificationPreferenceUpdate,
} from '@/models/notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreference[];
  pushToken: string | null;
  loadNotifications: (filters?: NotificationFilters) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreference: (preference: NotificationPreferenceUpdate) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, currentTenant } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [pushToken] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      if (!user || !currentTenant) return;

      try {
        setLoading(true);
        setError(null);
        const response = await NotificationService.getNotifications(filters);
        setNotifications(response.notifications);
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.detail || err?.message || 'Failed to load notifications';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [user, currentTenant],
  );

  const loadUnreadCount = useCallback(async () => {
    if (!user || !currentTenant) return;

    try {
      const response = await NotificationService.getUnreadCount();
      setUnreadCount(response.unread_count);
    } catch (err: any) {
    }
  }, [user, currentTenant]);

  const loadPreferences = useCallback(async () => {
    if (!user || !currentTenant) return;

    try {
      const response = await NotificationService.getNotificationPreferences();
      setPreferences(response.preferences);
    } catch (err: any) {
    }
  }, [user, currentTenant]);

  useEffect(() => {
    if (user && currentTenant) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    }
  }, [user, currentTenant, loadNotifications, loadUnreadCount, loadPreferences]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || err?.message || 'Failed to mark notification as read';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsUnread(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: false, read_at: undefined }
            : notification,
        ),
      );

      setUnreadCount((prev) => prev + 1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || err?.message || 'Failed to mark notification as unread';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || err?.message || 'Failed to mark all notifications as read';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await NotificationService.deleteNotification(notificationId);

        const deletedNotification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));

        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.detail || err?.message || 'Failed to delete notification';
        setError(errorMessage);
        throw err;
      }
    },
    [notifications],
  );

  const updatePreference = useCallback(async (preference: NotificationPreferenceUpdate) => {
    try {
      await NotificationService.updateNotificationPreference(preference);

      setPreferences((prev) =>
        prev.map((pref) =>
          pref.category === preference.category ? { ...pref, ...preference } : pref,
        ),
      );
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail || err?.message || 'Failed to update preference';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const updateNotification = useCallback(
    (notificationId: string, updates: Partial<Notification>) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, ...updates } : notification,
        ),
      );
    },
    [],
  );

  const removeNotification = useCallback(
    (notificationId: string) => {
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [notifications],
  );

  useEffect(() => {
    if (!user || !currentTenant) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, currentTenant, loadUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    pushToken,
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    updatePreference,
    refreshNotifications,
    addNotification,
    updateNotification,
    removeNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
