import { apiService } from './ApiService';
import {
  MaintenanceScheduleCreate,
  MaintenanceScheduleUpdate,
  MaintenanceScheduleResponse,
  MaintenanceWorkOrderCreate,
  MaintenanceWorkOrderUpdate,
  MaintenanceWorkOrderResponse,
  EquipmentCreate,
  EquipmentUpdate,
  EquipmentResponse,
  MaintenanceReportCreate,
  MaintenanceReportUpdate,
  MaintenanceReportResponse,
  MaintenanceDashboardStats,
  MaintenanceFilter,
} from '../models/maintenance';

export class MaintenanceService {
  private baseUrl = '/maintenance';

  // Maintenance Schedule Methods
  async createMaintenanceSchedule(
    data: MaintenanceScheduleCreate,
  ): Promise<MaintenanceScheduleResponse> {
    return apiService.post(`${this.baseUrl}/schedules`, data);
  }

  async getMaintenanceSchedules(
    skip = 0,
    limit = 100,
  ): Promise<MaintenanceScheduleResponse[]> {
    return apiService.get(
      `${this.baseUrl}/schedules?skip=${skip}&limit=${limit}`,
    );
  }

  async getMaintenanceSchedule(
    id: string,
  ): Promise<MaintenanceScheduleResponse> {
    return apiService.get(`${this.baseUrl}/schedules/${id}`);
  }

  async updateMaintenanceSchedule(
    id: string,
    data: MaintenanceScheduleUpdate,
  ): Promise<MaintenanceScheduleResponse> {
    return apiService.put(`${this.baseUrl}/schedules/${id}`, data);
  }

  async deleteMaintenanceSchedule(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/schedules/${id}`);
  }

  // Maintenance Work Order Methods
  async createMaintenanceWorkOrder(
    data: MaintenanceWorkOrderCreate,
  ): Promise<MaintenanceWorkOrderResponse> {
    return apiService.post(`${this.baseUrl}/work-orders`, data);
  }

  async getMaintenanceWorkOrders(
    skip = 0,
    limit = 100,
  ): Promise<MaintenanceWorkOrderResponse[]> {
    return apiService.get(
      `${this.baseUrl}/work-orders?skip=${skip}&limit=${limit}`,
    );
  }

  async getMaintenanceWorkOrder(
    id: string,
  ): Promise<MaintenanceWorkOrderResponse> {
    return apiService.get(`${this.baseUrl}/work-orders/${id}`);
  }

  async updateMaintenanceWorkOrder(
    id: string,
    data: MaintenanceWorkOrderUpdate,
  ): Promise<MaintenanceWorkOrderResponse> {
    return apiService.put(`${this.baseUrl}/work-orders/${id}`, data);
  }

  async deleteMaintenanceWorkOrder(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/work-orders/${id}`);
  }

  // Equipment Methods
  async createEquipment(data: EquipmentCreate): Promise<EquipmentResponse> {
    return apiService.post(`${this.baseUrl}/equipment`, data);
  }

  async getEquipmentList(skip = 0, limit = 100): Promise<EquipmentResponse[]> {
    return apiService.get(
      `${this.baseUrl}/equipment?skip=${skip}&limit=${limit}`,
    );
  }

  async getEquipment(id: string): Promise<EquipmentResponse> {
    return apiService.get(`${this.baseUrl}/equipment/${id}`);
  }

  async updateEquipment(
    id: string,
    data: EquipmentUpdate,
  ): Promise<EquipmentResponse> {
    return apiService.put(`${this.baseUrl}/equipment/${id}`, data);
  }

  async deleteEquipment(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/equipment/${id}`);
  }

  // Maintenance Report Methods
  async createMaintenanceReport(
    data: MaintenanceReportCreate,
  ): Promise<MaintenanceReportResponse> {
    return apiService.post(`${this.baseUrl}/reports`, data);
  }

  async getMaintenanceReports(
    skip = 0,
    limit = 100,
  ): Promise<MaintenanceReportResponse[]> {
    return apiService.get(
      `${this.baseUrl}/reports?skip=${skip}&limit=${limit}`,
    );
  }

  async getMaintenanceReport(id: string): Promise<MaintenanceReportResponse> {
    return apiService.get(`${this.baseUrl}/reports/${id}`);
  }

  async updateMaintenanceReport(
    id: string,
    data: MaintenanceReportUpdate,
  ): Promise<MaintenanceReportResponse> {
    return apiService.put(`${this.baseUrl}/reports/${id}`, data);
  }

  async deleteMaintenanceReport(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/reports/${id}`);
  }

  // Dashboard and Statistics Methods
  async getMaintenanceDashboard(): Promise<MaintenanceDashboardStats> {
    return apiService.get(`${this.baseUrl}/dashboard`);
  }

  async getRecentMaintenanceSchedules(
    limit = 5,
  ): Promise<MaintenanceScheduleResponse[]> {
    return apiService.get(
      `${this.baseUrl}/stats/recent-schedules?limit=${limit}`,
    );
  }

  async getUpcomingMaintenance(
    limit = 5,
  ): Promise<MaintenanceScheduleResponse[]> {
    return apiService.get(
      `${this.baseUrl}/stats/upcoming-maintenance?limit=${limit}`,
    );
  }

  async getCriticalMaintenance(
    limit = 5,
  ): Promise<MaintenanceScheduleResponse[]> {
    return apiService.get(
      `${this.baseUrl}/stats/critical-maintenance?limit=${limit}`,
    );
  }

  // Filtered Search Methods
  async searchMaintenanceSchedules(
    query: string,
    filters?: MaintenanceFilter,
  ): Promise<MaintenanceScheduleResponse[]> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    return apiService.get(
      `${this.baseUrl}/schedules/search?${params.toString()}`,
    );
  }

  async searchMaintenanceWorkOrders(
    query: string,
    filters?: MaintenanceFilter,
  ): Promise<MaintenanceWorkOrderResponse[]> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    return apiService.get(
      `${this.baseUrl}/work-orders/search?${params.toString()}`,
    );
  }

  async searchEquipment(
    query: string,
    filters?: MaintenanceFilter,
  ): Promise<EquipmentResponse[]> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    return apiService.get(
      `${this.baseUrl}/equipment/search?${params.toString()}`,
    );
  }

  async searchMaintenanceReports(
    query: string,
    filters?: MaintenanceFilter,
  ): Promise<MaintenanceReportResponse[]> {
    const params = new URLSearchParams({ query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    return apiService.get(
      `${this.baseUrl}/reports/search?${params.toString()}`,
    );
  }
}

export const maintenanceService = new MaintenanceService();
