import { apiService } from './ApiService';
import {
  ProductionPlanResponse as ProductionPlan,
  ProductionPlanCreate,
  ProductionPlanUpdate,
  ProductionPlansResponse,
  ProductionStepBase as ProductionStep,
  ProductionStepCreate,
  ProductionStepUpdate,
  ProductionStepsResponse,
  ProductionScheduleBase as ProductionSchedule,
  ProductionScheduleCreate,
  ProductionScheduleUpdate,
  ProductionSchedulesResponse,
  ProductionDashboard,
  ProductionPlanFilters,
} from '../models/production';

export class ProductionService {
  private baseUrl = '/production';

  // Production Plan CRUD operations
  async createProductionPlan(
    planData: ProductionPlanCreate,
  ): Promise<ProductionPlan> {
    const response = await apiService.post(`${this.baseUrl}/`, planData);
    return response;
  }

  async getProductionPlans(
    filters: ProductionPlanFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<ProductionPlansResponse> {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.production_type)
      queryParams.append('production_type', filters.production_type);
    if (filters.project_id)
      queryParams.append('project_id', filters.project_id);
    if (filters.work_order_id)
      queryParams.append('work_order_id', filters.work_order_id);
    if (filters.assigned_to_id)
      queryParams.append('assigned_to_id', filters.assigned_to_id);
    if (filters.planned_start_date_from)
      queryParams.append(
        'planned_start_date_from',
        filters.planned_start_date_from,
      );
    if (filters.planned_start_date_to)
      queryParams.append(
        'planned_start_date_to',
        filters.planned_start_date_to,
      );
    if (filters.planned_end_date_from)
      queryParams.append(
        'planned_end_date_from',
        filters.planned_end_date_from,
      );
    if (filters.planned_end_date_to)
      queryParams.append('planned_end_date_to', filters.planned_end_date_to);
    if (filters.search) queryParams.append('search', filters.search);

    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/?${queryParams.toString()}`,
    );

    // Transform the response to match ProductionPlansResponse interface
    return {
      production_plans: response,
      total: response.length,
      page,
      limit,
      total_pages: Math.ceil(response.length / limit),
    };
  }

  async getProductionPlan(id: string): Promise<ProductionPlan> {
    const response = await apiService.get(`${this.baseUrl}/${id}`);
    return response;
  }

  async updateProductionPlan(
    id: string,
    planData: ProductionPlanUpdate,
  ): Promise<ProductionPlan> {
    const response = await apiService.put(`${this.baseUrl}/${id}`, planData);
    return response;
  }

  async deleteProductionPlan(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  // Production Step operations
  async getProductionSteps(planId: string): Promise<ProductionStepsResponse> {
    const response = await apiService.get(`${this.baseUrl}/${planId}/steps`);
    return {
      production_steps: response,
      total: response.length,
    };
  }

  async createProductionStep(
    planId: string,
    stepData: ProductionStepCreate,
  ): Promise<ProductionStep> {
    const response = await apiService.post(
      `${this.baseUrl}/${planId}/steps`,
      stepData,
    );
    return response;
  }

  async updateProductionStep(
    stepId: string,
    stepData: ProductionStepUpdate,
  ): Promise<ProductionStep> {
    const response = await apiService.put(
      `${this.baseUrl}/steps/${stepId}`,
      stepData,
    );
    return response;
  }

  async deleteProductionStep(stepId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/steps/${stepId}`);
  }

  // Production Schedule operations
  async getProductionSchedules(
    planId: string,
  ): Promise<ProductionSchedulesResponse> {
    const response = await apiService.get(
      `${this.baseUrl}/${planId}/schedules`,
    );
    return {
      production_schedules: response,
      total: response.length,
    };
  }

  async createProductionSchedule(
    planId: string,
    scheduleData: ProductionScheduleCreate,
  ): Promise<ProductionSchedule> {
    const response = await apiService.post(
      `${this.baseUrl}/${planId}/schedules`,
      scheduleData,
    );
    return response;
  }

  async updateProductionSchedule(
    scheduleId: string,
    scheduleData: ProductionScheduleUpdate,
  ): Promise<ProductionSchedule> {
    const response = await apiService.put(
      `${this.baseUrl}/schedules/${scheduleId}`,
      scheduleData,
    );
    return response;
  }

  async deleteProductionSchedule(scheduleId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/schedules/${scheduleId}`);
  }

  // Dashboard and Statistics
  async getProductionDashboard(): Promise<ProductionDashboard> {
    const response = await apiService.get(`${this.baseUrl}/dashboard`);
    return response;
  }

  async getProductionStats(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  // Utility methods
  async getProductionPlansByStatus(status: string): Promise<ProductionPlan[]> {
    const response = await apiService.get(`${this.baseUrl}/?status=${status}`);
    return response;
  }

  async getProductionPlansByPriority(
    priority: string,
  ): Promise<ProductionPlan[]> {
    const response = await apiService.get(
      `${this.baseUrl}/?priority=${priority}`,
    );
    return response;
  }

  async getProductionPlansByProject(
    projectId: string,
  ): Promise<ProductionPlan[]> {
    const response = await apiService.get(
      `${this.baseUrl}/?project_id=${projectId}`,
    );
    return response;
  }

  async getProductionPlansByWorkOrder(
    workOrderId: string,
  ): Promise<ProductionPlan[]> {
    const response = await apiService.get(
      `${this.baseUrl}/?work_order_id=${workOrderId}`,
    );
    return response;
  }

  async searchProductionPlans(query: string): Promise<ProductionPlan[]> {
    const response = await apiService.get(
      `${this.baseUrl}/?search=${encodeURIComponent(query)}`,
    );
    return response;
  }
}

export default ProductionService;
