import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface SessionData {
  token: string;
  user: any;
  expiresAt?: number;
  refreshToken?: string;
}

class SessionManager {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly EXPIRES_KEY = 'token_expires';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly LAST_ACTIVITY_KEY = 'last_activity';
  private readonly SESSION_TIMEOUT_KEY = 'session_timeout';
  
  private sessionTimeoutDuration: number = 30 * 60 * 1000;
  private expirationCheckInterval: NodeJS.Timeout | null = null;
  private proactiveRefreshInterval: NodeJS.Timeout | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;
  private appStateSubscription: any = null;

  async setToken(token: string, expiresIn?: number): Promise<void> {
    await SecureStore.setItemAsync(this.TOKEN_KEY, token);
    
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000;
      await AsyncStorage.setItem(this.EXPIRES_KEY, expiresAt.toString());
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(this.TOKEN_KEY);
      
      if (!token) {
        return null;
      }

      const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
      
      if (expiresAt) {
        const now = Date.now();
        if (now > parseInt(expiresAt)) {
          await this.clearSession();
          return null;
        }
      }

      return token;
    } catch (error) {
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.TOKEN_KEY);
      await AsyncStorage.removeItem(this.EXPIRES_KEY);
    } catch (error) {
    }
  }

  async setRefreshToken(refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
    }
  }

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      if (!userData) return null;

      return JSON.parse(userData);
    } catch (error) {
      await this.removeUser();
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_KEY);
    } catch (error) {
    }
  }

  async getSession(): Promise<SessionData | null> {
    const token = await this.getToken();
    const user = await this.getUser();

    if (!token || !user) return null;

    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    const refreshToken = await this.getRefreshToken();

    return {
      token,
      user,
      expiresAt: expiresAt ? parseInt(expiresAt) : undefined,
      refreshToken: refreshToken || undefined,
    };
  }

  async clearSession(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
    await this.removeRefreshToken();
    await AsyncStorage.removeItem('currentTenantId');
    await AsyncStorage.removeItem('userTenants');
    await AsyncStorage.removeItem(this.LAST_ACTIVITY_KEY);
    this.stopSessionMonitoring();
  }

  async isSessionValid(): Promise<boolean> {
    const token = await this.getToken();
    const user = await this.getUser();

    return !!(token && user);
  }

  async isTokenExpired(): Promise<boolean> {
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return false;

    return Date.now() > parseInt(expiresAt);
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const { config } = await import('@/constants');
      const apiUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
      
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.setToken(data.access_token, data.expires_in);

        if (data.refresh_token) {
          await this.setRefreshToken(data.refresh_token);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async getTokenExpirationTime(): Promise<Date | null> {
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return null;

    return new Date(parseInt(expiresAt));
  }

  async getTimeUntilExpiration(): Promise<number | null> {
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return null;

    const expirationTime = parseInt(expiresAt);
    return Math.max(0, expirationTime - Date.now());
  }

  async updateLastActivity(): Promise<void> {
    await AsyncStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  async getLastActivity(): Promise<number | null> {
    const lastActivity = await AsyncStorage.getItem(this.LAST_ACTIVITY_KEY);
    if (!lastActivity) return null;
    return parseInt(lastActivity);
  }

  async isSessionTimeout(): Promise<boolean> {
    const lastActivity = await this.getLastActivity();
    if (!lastActivity) return false;

    const timeSinceLastActivity = Date.now() - lastActivity;
    return timeSinceLastActivity > this.sessionTimeoutDuration;
  }

  setSessionTimeout(duration: number): void {
    this.sessionTimeoutDuration = duration;
    AsyncStorage.setItem(this.SESSION_TIMEOUT_KEY, duration.toString());
  }

  async getSessionTimeout(): Promise<number> {
    const stored = await AsyncStorage.getItem(this.SESSION_TIMEOUT_KEY);
    if (stored) {
      this.sessionTimeoutDuration = parseInt(stored);
    }
    return this.sessionTimeoutDuration;
  }

  async setSession(
    token: string,
    user: any,
    expiresIn?: number,
    refreshToken?: string,
  ): Promise<void> {
    await this.setToken(token, expiresIn);
    await this.setUser(user);
    if (refreshToken) {
      await this.setRefreshToken(refreshToken);
    }
    await this.updateLastActivity();
  }

  async clearSession(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
    await this.removeRefreshToken();
    await AsyncStorage.removeItem('currentTenantId');
    await AsyncStorage.removeItem('userTenants');
    await AsyncStorage.removeItem(this.LAST_ACTIVITY_KEY);
    this.stopSessionMonitoring();
  }

  onSessionExpired(callback: () => void): void {
    this.onSessionExpiredCallback = callback;
    this.startSessionMonitoring();
  }

  private async checkSessionExpiration(): Promise<void> {
    const isExpired = await this.isTokenExpired();
    const isTimeout = await this.isSessionTimeout();

    if (isExpired || isTimeout) {
      if (isExpired) {
        const refreshSuccess = await this.refreshAccessToken();
        if (!refreshSuccess) {
          await this.clearSession();
          if (this.onSessionExpiredCallback) {
            this.onSessionExpiredCallback();
          }
          return;
        }
      }

      if (isTimeout) {
        await this.clearSession();
        if (this.onSessionExpiredCallback) {
          this.onSessionExpiredCallback();
        }
        return;
      }
    }

    await this.updateLastActivity();
  }

  startSessionMonitoring(): void {
    this.stopSessionMonitoring();

    this.expirationCheckInterval = setInterval(async () => {
      await this.checkSessionExpiration();
    }, 60000);

    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await this.checkSessionExpiration();
      }
    });
  }

  stopSessionMonitoring(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = null;
    }

    if (this.proactiveRefreshInterval) {
      clearInterval(this.proactiveRefreshInterval);
      this.proactiveRefreshInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  startProactiveRefresh(): void {
    this.stopProactiveRefresh();

    const refreshBeforeExpiration = async () => {
      try {
        const timeUntilExpiration = await this.getTimeUntilExpiration();

        if (timeUntilExpiration && timeUntilExpiration < 5 * 60 * 1000) {
          const refreshSuccess = await this.refreshAccessToken();
          if (!refreshSuccess) {
          }
        }
      } catch (error) {
      }
    };

    this.proactiveRefreshInterval = setInterval(refreshBeforeExpiration, 2 * 60 * 1000);
    refreshBeforeExpiration();
  }

  stopProactiveRefresh(): void {
    if (this.proactiveRefreshInterval) {
      clearInterval(this.proactiveRefreshInterval);
      this.proactiveRefreshInterval = null;
    }
  }

  async getSessionInfo(): Promise<{
    hasToken: boolean;
    hasUser: boolean;
    isExpired: boolean;
    isTimeout: boolean;
    expiresAt: Date | null;
    timeUntilExpiration: number | null;
    lastActivity: number | null;
    timeSinceLastActivity: number | null;
  }> {
    const token = await this.getToken();
    const user = await this.getUser();
    const isExpired = await this.isTokenExpired();
    const isTimeout = await this.isSessionTimeout();
    const expiresAt = await this.getTokenExpirationTime();
    const timeUntilExpiration = await this.getTimeUntilExpiration();
    const lastActivity = await this.getLastActivity();
    const timeSinceLastActivity = lastActivity ? Date.now() - lastActivity : null;

    return {
      hasToken: !!token,
      hasUser: !!user,
      isExpired,
      isTimeout,
      expiresAt,
      timeUntilExpiration,
      lastActivity,
      timeSinceLastActivity,
    };
  }
}

export { SessionManager };
export default SessionManager;

