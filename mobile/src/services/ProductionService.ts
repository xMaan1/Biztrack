import { apiService } from './ApiService';
import {
  ProductionPlan,
  ProductionPlanCreate,
  ProductionPlanUpdate,
  ProductionPlanFilters,
  ProductionStatus,
  ProductionPriority,
  ProductionType,
} from '../models/production';

class ProductionService {
  private baseUrl = '/production';

  async getProductionPlans(
    filters: ProductionPlanFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<{ productionPlans: ProductionPlan[]; pagination?: any }> {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.production_type) params.append('production_type', filters.production_type);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.work_order_id) params.append('work_order_id', filters.work_order_id);
    if (filters.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);
    if (filters.planned_start_date_from) params.append('planned_start_date_from', filters.planned_start_date_from);
    if (filters.planned_start_date_to) params.append('planned_start_date_to', filters.planned_start_date_to);
    if (filters.planned_end_date_from) params.append('planned_end_date_from', filters.planned_end_date_from);
    if (filters.planned_end_date_to) params.append('planned_end_date_to', filters.planned_end_date_to);
    if (filters.search) params.append('search', filters.search);

    const response = await apiService.get(`${this.baseUrl}/?${params.toString()}`);
    return {
      productionPlans: Array.isArray(response) ? response : response.data || [],
      pagination: response.pagination,
    };
  }

  async getProductionPlan(planId: string): Promise<ProductionPlan> {
    const response = await apiService.get(`${this.baseUrl}/${planId}`);
    return response;
  }

  async createProductionPlan(planData: ProductionPlanCreate): Promise<ProductionPlan> {
    const response = await apiService.post(this.baseUrl, planData);
    return response;
  }

  async updateProductionPlan(
    planId: string,
    planData: ProductionPlanUpdate,
  ): Promise<ProductionPlan> {
    const response = await apiService.put(`${this.baseUrl}/${planId}`, planData);
    return response;
  }

  async deleteProductionPlan(planId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${planId}`);
  }

  getStatusColor(status: ProductionStatus): { bg: string; border: string } {
    const statusColors: Record<string, { bg: string; border: string }> = {
      planned: { bg: '#dbeafe', border: '#3b82f6' },
      in_progress: { bg: '#fef3c7', border: '#f59e0b' },
      on_hold: { bg: '#fde68a', border: '#f59e0b' },
      completed: { bg: '#d1fae5', border: '#10b981' },
      cancelled: { bg: '#fee2e2', border: '#ef4444' },
    };
    return statusColors[status] || { bg: '#f3f4f6', border: '#6b7280' };
  }

  getStatusLabel(status: ProductionStatus | string): string {
    const statusLabels: Record<string, string> = {
      planned: 'Planned',
      in_progress: 'In Progress',
      on_hold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
  }

  getPriorityColor(priority: ProductionPriority | string): { bg: string; border: string } {
    const priorityColors: Record<string, { bg: string; border: string }> = {
      low: { bg: '#d1fae5', border: '#10b981' },
      medium: { bg: '#dbeafe', border: '#3b82f6' },
      high: { bg: '#fde68a', border: '#f59e0b' },
      urgent: { bg: '#fee2e2', border: '#ef4444' },
    };
    return priorityColors[priority] || { bg: '#f3f4f6', border: '#6b7280' };
  }

  getPriorityLabel(priority: ProductionPriority | string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  getTypeIcon(type: ProductionType | string): string {
    const typeIcons: Record<string, string> = {
      batch: '📦',
      continuous: '🏭',
      job_shop: '🔧',
      assembly: '✓',
      custom: '⭐',
    };
    return typeIcons[type] || '🏭';
  }

  getTypeLabel(type: ProductionType | string): string {
    const typeLabels: Record<string, string> = {
      batch: 'Batch',
      continuous: 'Continuous',
      job_shop: 'Job Shop',
      assembly: 'Assembly',
      custom: 'Custom',
    };
    return typeLabels[type] || type;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async getProductionSteps(planId: string): Promise<{ productionSteps: any[]; total: number }> {
    const response = await apiService.get(`${this.baseUrl}/${planId}/steps`);
    return {
      productionSteps: Array.isArray(response) ? response : response.data || [],
      total: Array.isArray(response) ? response.length : response.total || 0,
    };
  }

  async createProductionStep(
    planId: string,
    stepData: any,
  ): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/${planId}/steps`, stepData);
    return response;
  }

  async updateProductionStep(
    stepId: string,
    stepData: any,
  ): Promise<any> {
    const response = await apiService.put(`${this.baseUrl}/steps/${stepId}`, stepData);
    return response;
  }

  async deleteProductionStep(stepId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/steps/${stepId}`);
  }

  async getProductionSchedules(
    planId: string,
  ): Promise<{ productionSchedules: any[]; total: number }> {
    const response = await apiService.get(`${this.baseUrl}/${planId}/schedules`);
    return {
      productionSchedules: Array.isArray(response) ? response : response.data || [],
      total: Array.isArray(response) ? response.length : response.total || 0,
    };
  }

  async createProductionSchedule(
    planId: string,
    scheduleData: any,
  ): Promise<any> {
    const response = await apiService.post(`${this.baseUrl}/${planId}/schedules`, scheduleData);
    return response;
  }

  async updateProductionSchedule(
    scheduleId: string,
    scheduleData: any,
  ): Promise<any> {
    const response = await apiService.put(`${this.baseUrl}/schedules/${scheduleId}`, scheduleData);
    return response;
  }

  async deleteProductionSchedule(scheduleId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/schedules/${scheduleId}`);
  }

  async getProductionDashboard(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/dashboard`);
    return response;
  }

  async getProductionStats(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  async getProductionPlansByStatus(status: string): Promise<ProductionPlan[]> {
    const response = await apiService.get(`${this.baseUrl}/?status=${status}`);
    return Array.isArray(response) ? response : response.data || [];
  }

  async getProductionPlansByPriority(
    priority: string,
  ): Promise<ProductionPlan[]> {
    const response = await apiService.get(`${this.baseUrl}/?priority=${priority}`);
    return Array.isArray(response) ? response : response.data || [];
  }

  async getProductionPlansByProject(
    projectId: string,
  ): Promise<ProductionPlan[]> {
    const response = await apiService.get(`${this.baseUrl}/?project_id=${projectId}`);
    return Array.isArray(response) ? response : response.data || [];
  }

  async getProductionPlansByWorkOrder(
    workOrderId: string,
  ): Promise<ProductionPlan[]> {
    const response = await apiService.get(`${this.baseUrl}/?work_order_id=${workOrderId}`);
    return Array.isArray(response) ? response : response.data || [];
  }

  async searchProductionPlans(query: string): Promise<ProductionPlan[]> {
    const response = await apiService.get(
      `${this.baseUrl}/?search=${encodeURIComponent(query)}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }
}

export default new ProductionService();
