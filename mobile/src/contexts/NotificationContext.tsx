import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import NotificationService from '@/services/NotificationService';
import {
  Notification,
  NotificationFilters,
  NotificationPreference,
  NotificationPreferenceUpdate,
} from '@/models/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreference[];
  expoPushToken: string | null;

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
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (notification.request.content.data) {
        const notificationData = notification.request.content.data as any;
        if (notificationData.notification) {
          addNotification(notificationData.notification);
        }
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.action_url) {
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user && currentTenant) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences([]);
    }
  }, [user, currentTenant]);

  useEffect(() => {
    if (!user || !currentTenant) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, currentTenant]);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      return null;
    }
  };

  const loadNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    if (!user || !currentTenant) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await NotificationService.getNotifications(filters);
      setNotifications(response.notifications);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to load notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, currentTenant]);

  const loadUnreadCount = useCallback(async () => {
    if (!user || !currentTenant) return;
    
    try {
      const response = await NotificationService.getUnreadCount();
      setUnreadCount(response.unread_count);
      
      if (expoPushToken) {
        await Notifications.setBadgeCountAsync(response.unread_count);
      }
    } catch (err: any) {
    }
  }, [user, currentTenant, expoPushToken]);

  const loadPreferences = useCallback(async () => {
    if (!user || !currentTenant) return;
    
    try {
      const response = await NotificationService.getNotificationPreferences();
      setPreferences(response.preferences);
    } catch (err: any) {
    }
  }, [user, currentTenant]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (expoPushToken) {
        await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to mark notification as read';
      setError(errorMessage);
      throw err;
    }
  }, [unreadCount, expoPushToken]);

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsUnread(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: false, read_at: undefined }
            : notification
        )
      );
      
      setUnreadCount(prev => prev + 1);
      
      if (expoPushToken) {
        await Notifications.setBadgeCountAsync(unreadCount + 1);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to mark notification as unread';
      setError(errorMessage);
      throw err;
    }
  }, [unreadCount, expoPushToken]);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      
      setUnreadCount(0);
      
      if (expoPushToken) {
        await Notifications.setBadgeCountAsync(0);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to mark all notifications as read';
      setError(errorMessage);
    }
  }, [expoPushToken]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        if (expoPushToken) {
          await Notifications.setBadgeCountAsync(Math.max(0, unreadCount - 1));
        }
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to delete notification';
      setError(errorMessage);
      throw err;
    }
  }, [notifications, unreadCount, expoPushToken]);

  const updatePreference = useCallback(async (preference: NotificationPreferenceUpdate) => {
    try {
      await NotificationService.updateNotificationPreference(preference);
      
      setPreferences(prev => 
        prev.map(pref => 
          pref.category === preference.category
            ? { ...pref, ...preference }
            : pref
        )
      );
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to update preference';
      setError(errorMessage);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadUnreadCount(),
    ]);
  }, [loadNotifications, loadUnreadCount]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        if (expoPushToken) {
          Notifications.setBadgeCountAsync(newCount);
        }
        return newCount;
      });
    }
  }, [expoPushToken]);

  const updateNotification = useCallback((notificationId: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    const deletedNotification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    
    if (deletedNotification && !deletedNotification.is_read) {
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        if (expoPushToken) {
          Notifications.setBadgeCountAsync(newCount);
        }
        return newCount;
      });
    }
  }, [notifications, expoPushToken]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    expoPushToken,
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

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}


