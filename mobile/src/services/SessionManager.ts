import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  getTokenExpirationTime(): Date | null {
    return null;
  }

  async getTimeUntilExpiration(): Promise<number | null> {
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return null;

    const expirationTime = parseInt(expiresAt);
    return Math.max(0, expirationTime - Date.now());
  }
}

export { SessionManager };
export default SessionManager;

