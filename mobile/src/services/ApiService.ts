import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { SessionManager } from './SessionManager';
import { config } from '@/constants';

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiService {
  private client: AxiosInstance;
  private sessionManager: SessionManager;
  private publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/auth/reset-password/confirm',
    '/public/plans',
  ];
  private currentTenantId: string | null = null;
  private onUnauthorized?: () => void;

  constructor() {
    this.sessionManager = new SessionManager();

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.initializeTenantId();
    this.setupInterceptors();
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private async initializeTenantId() {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const tenantId = await AsyncStorage.default.getItem('currentTenantId');
      this.currentTenantId = tenantId;
    } catch (error) {
    }
  }

  setTenantId(tenantId: string | null) {
    this.currentTenantId = tenantId;
    this.storeTenantId(tenantId);
  }

  private async storeTenantId(tenantId: string | null) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      if (tenantId) {
        await AsyncStorage.default.setItem('currentTenantId', tenantId);
      } else {
        await AsyncStorage.default.removeItem('currentTenantId');
        await AsyncStorage.default.removeItem('userTenants');
      }
    } catch (error) {
    }
  }

  async getTenantId(): Promise<string | null> {
    if (this.currentTenantId) {
      return this.currentTenantId;
    }
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const tenantId = await AsyncStorage.default.getItem('currentTenantId');
      this.currentTenantId = tenantId;
      return tenantId;
    } catch (error) {
      return null;
    }
  }

  async setUserTenants(tenants: any[]) {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('userTenants', JSON.stringify(tenants));
    } catch (error) {
    }
  }

  async getUserTenants(): Promise<any[]> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const stored = await AsyncStorage.default.getItem('userTenants');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          await AsyncStorage.default.removeItem('userTenants');
        }
      }
    } catch (error) {
    }
    return [];
  }

  async getCurrentTenant(): Promise<any | null> {
    const tenantId = await this.getTenantId();
    if (!tenantId) return null;

    const tenants = await this.getUserTenants();
    return tenants.find((t) => t.id === tenantId) || null;
  }

  async refreshTenants(): Promise<any[]> {
    try {
      const tenantsResponse = await this.getMyTenants();
      if (tenantsResponse.tenants) {
        await this.setUserTenants(tenantsResponse.tenants);
        return tenantsResponse.tenants;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const isPublicEndpoint = this.publicEndpoints.some((endpoint) => {
          return config.url?.includes(endpoint);
        });

        if (isPublicEndpoint) {
          return config;
        }

        const isSessionValid = await this.sessionManager.isSessionValid();
        
        if (!isSessionValid) {
          return Promise.reject(new Error('Not authenticated'));
        }

        const token = await this.sessionManager.getToken();
        
        if (!token) {
          return Promise.reject(new Error('Authentication token missing'));
        }

        config.headers.Authorization = `Bearer ${token}`;

        const tenantId = await this.getTenantId();
        
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
          return Promise.reject(new Error('Request timeout. Please try again.'));
        }

        if (error.response?.status === 401) {
          if (error.config._retry) {
            await this.sessionManager.clearSession();
            if (this.onUnauthorized) {
              this.onUnauthorized();
            }
            return Promise.reject(error);
          }

          const refreshSuccess = await this.sessionManager.refreshAccessToken();
          if (refreshSuccess) {
            const originalRequest = error.config;
            originalRequest._retry = true;
            const token = await this.sessionManager.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } else {
            await this.sessionManager.clearSession();
            if (this.onUnauthorized) {
              this.onUnauthorized();
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async login(credentials: { email: string; password: string }) {
    try {
      const response = await this.post('/auth/login', credentials);

      if (response.success && response.token && response.user) {
        await this.sessionManager.setSession(
          response.token,
          response.user,
          response.expires_in,
          response.refresh_token,
        );

        try {
          const tenantsResponse = await this.getMyTenants();
          if (tenantsResponse.tenants && tenantsResponse.tenants.length > 0) {
            await this.setUserTenants(tenantsResponse.tenants);
            this.setTenantId(tenantsResponse.tenants[0].id);
          }
        } catch (tenantError) {
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: {
    userName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.post('/auth/register', userData);
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async logout() {
    try {
      const response = await this.post('/auth/logout');
      this.setTenantId(null);
      return response;
    } catch (error) {
      this.setTenantId(null);
      throw error;
    }
  }

  async getUsers() {
    const tenantId = await this.getTenantId();
    if (tenantId) {
      return this.getTenantUsers(tenantId);
    }
    return this.get('/users');
  }

  async getTenantUsers(tenantId: string) {
    return this.get(`/tenants/${tenantId}/users`);
  }

  async getCurrentTenantUsers() {
    const tenantId = await this.getTenantId();
    if (!tenantId) {
      throw new Error('No tenant selected');
    }
    return this.getTenantUsers(tenantId);
  }

  async getUser(id: string) {
    return this.get(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.put(`/auth/users/${id}`, data);
  }

  async getMyProfile() {
    return this.get('/profile/me');
  }

  async getMyTenants() {
    return this.get('/auth/tenants');
  }

  async switchTenant(tenantId: string) {
    const storedTenants = await this.getUserTenants();
    const tenant = storedTenants.find((t: any) => t.id === tenantId);

    if (!tenant) {
      throw new Error('Access denied to this tenant');
    }

    this.setTenantId(tenantId);
    return tenant;
  }

  async getDashboardOverview() {
    return this.get('/dashboard/overview');
  }

  async getCurrentSubscription() {
    return this.get('/tenants/current/subscription');
  }

  async resetPassword(email: string) {
    return this.post('/auth/reset-password', { email });
  }

  async getRoles() {
    return this.get('/rbac/roles');
  }

  async createRole(roleData: any) {
    return this.post('/rbac/roles', roleData);
  }

  async updateRole(roleId: string, roleData: any) {
    return this.put(`/rbac/roles/${roleId}`, roleData);
  }

  async deleteRole(roleId: string) {
    return this.delete(`/rbac/roles/${roleId}`);
  }

  async getRBACTenantUsers() {
    return this.get('/rbac/tenant-users');
  }

  async createTenantUser(userData: any) {
    return this.post('/rbac/tenant-users', userData);
  }

  async updateTenantUser(userId: string, userData: any) {
    return this.put(`/rbac/tenant-users/${userId}`, userData);
  }

  async deleteTenantUser(userId: string) {
    return this.delete(`/rbac/tenant-users/${userId}`);
  }

  async createUser(userData: any, roleId: string) {
    return this.post(`/rbac/create-user?role_id=${roleId}`, userData);
  }

  async getUserPermissions() {
    return this.get('/rbac/permissions');
  }
}

export const apiService = new ApiService();
export default apiService;

