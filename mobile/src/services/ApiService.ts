import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { SessionManager } from "./SessionManager";
import { API_BASE_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

type NavigationCallback = () => void;

export class ApiService {
  private client: AxiosInstance;
  private sessionManager: SessionManager;
  private publicEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/reset-password",
    "/auth/reset-password/confirm",
    "/public/plans",
  ];
  private currentTenantId: string | null = null;
  private onUnauthorizedCallback: NavigationCallback | null = null;

  constructor() {
    this.sessionManager = new SessionManager();

    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.initializeTenantId();
    this.setupInterceptors();
  }

  setOnUnauthorizedCallback(callback: NavigationCallback) {
    this.onUnauthorizedCallback = callback;
  }

  private async initializeTenantId() {
    try {
      const tenantId = await AsyncStorage.getItem("currentTenantId");
      this.currentTenantId = tenantId;
    } catch (error) {
    }
  }

  async setTenantId(tenantId: string | null): Promise<void> {
    this.currentTenantId = tenantId;
    if (tenantId) {
      await AsyncStorage.setItem("currentTenantId", tenantId);
    } else {
      await AsyncStorage.multiRemove(["currentTenantId", "userTenants"]);
    }
  }

  async getTenantId(): Promise<string | null> {
    if (this.currentTenantId) {
      return this.currentTenantId;
    }
    try {
      const tenantId = await AsyncStorage.getItem("currentTenantId");
      this.currentTenantId = tenantId;
      return tenantId;
    } catch (error) {
      return null;
    }
  }

  async setUserTenants(tenants: any[]): Promise<void> {
    await AsyncStorage.setItem("userTenants", JSON.stringify(tenants));
  }

  async getUserTenants(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem("userTenants");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      await AsyncStorage.removeItem("userTenants");
    }
    return [];
  }

  async getCurrentTenant(): Promise<any | null> {
    const tenantId = await this.getTenantId();
    if (!tenantId) return null;

    const tenants = await this.getUserTenants();
    return tenants.find((t: any) => t.id === tenantId) || null;
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
          return Promise.reject(new Error("Not authenticated"));
        }

        const token = await this.sessionManager.getToken();

        if (!token) {
          return Promise.reject(new Error("Authentication token missing"));
        }

        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const tenantId = await this.getTenantId();

        if (tenantId && config.headers) {
          config.headers["X-Tenant-ID"] = tenantId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
          return Promise.reject(new Error("Request timeout. Please try again."));
        }

        if (error.response?.status === 401) {
          if (error.config?._retry) {
            await this.sessionManager.clearSession();
            if (this.onUnauthorizedCallback) {
              this.onUnauthorizedCallback();
            }
            return Promise.reject(error);
          }

          const refreshSuccess = await this.sessionManager.refreshAccessToken();
          if (refreshSuccess) {
            const originalRequest = error.config;
            originalRequest._retry = true;
            const token = await this.sessionManager.getToken();
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } else {
            await this.sessionManager.clearSession();
            if (this.onUnauthorizedCallback) {
              this.onUnauthorizedCallback();
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
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
      const response = await this.post("/auth/login", credentials);

      if (response.success && response.token && response.user) {
        await this.sessionManager.setSession(
          response.token,
          response.user,
          response.expires_in,
          response.refresh_token
        );

        try {
          const tenantsResponse = await this.getMyTenants();
          if (tenantsResponse.tenants && tenantsResponse.tenants.length > 0) {
            await this.setUserTenants(tenantsResponse.tenants);
            await this.setTenantId(tenantsResponse.tenants[0].id);
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
    return this.post("/auth/register", userData);
  }

  async getCurrentUser() {
    return this.get("/auth/me");
  }

  async logout() {
    try {
      const response = await this.post("/auth/logout");
      await this.setTenantId(null);
      return response;
    } catch (error) {
      await this.setTenantId(null);
      throw error;
    }
  }

  async getMyTenants() {
    return this.get("/tenants/my-tenants");
  }

  async getTenant(tenantId: string) {
    return this.get(`/tenants/${tenantId}`);
  }

  async switchTenant(tenantId: string) {
    const storedTenants = await this.getUserTenants();
    const tenant = storedTenants.find((t: any) => t.id === tenantId);

    if (!tenant) {
      throw new Error("Access denied to this tenant");
    }

    await this.setTenantId(tenantId);
    return tenant;
  }

  async healthCheck() {
    return this.get("/health");
  }
}

export const apiService = new ApiService();
export default apiService;


