import { apiService } from './ApiService';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description: string;
  work_order_type: string;
  status: string;
  priority: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  completion_percentage: number;
  assigned_to_id: string | null;
  project_id: string | null;
  location: string | null;
  instructions: string | null;
  safety_notes: string | null;
  quality_requirements: string | null;
  materials_required: string[];
  estimated_cost: number;
  actual_cost: number;
  current_step: string | null;
  notes: string[];
  tags: string[];
  attachments: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderCreate {
  title: string;
  description: string;
  work_order_type: string;
  status?: string;
  priority?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  estimated_hours?: number;
  location?: string;
  instructions?: string;
  safety_notes?: string;
  quality_requirements?: string;
  materials_required?: string[];
  estimated_cost?: number;
  tags?: string[];
  project_id?: string;
  assigned_to_id?: string;
}

export interface WorkOrderUpdate extends Partial<WorkOrderCreate> {}

export interface WorkOrderFilters {
  status?: string;
  work_order_type?: string;
  project_id?: string;
  assigned_to_id?: string;
  search?: string;
}

class WorkOrderService {
  private baseUrl = '/work-orders';

  async getWorkOrders(
    filters: WorkOrderFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<{ workOrders: WorkOrder[]; pagination?: any }> {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    if (filters.status) params.append('status', filters.status);
    if (filters.work_order_type) params.append('work_order_type', filters.work_order_type);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);

    const response = await apiService.get(`${this.baseUrl}/?${params.toString()}`);
    return {
      workOrders: Array.isArray(response) ? response : response.data || [],
      pagination: response.pagination,
    };
  }

  async getWorkOrder(workOrderId: string): Promise<WorkOrder> {
    const response = await apiService.get(`${this.baseUrl}/${workOrderId}`);
    return response;
  }

  async createWorkOrder(workOrderData: WorkOrderCreate): Promise<WorkOrder> {
    const response = await apiService.post(this.baseUrl, workOrderData);
    return response;
  }

  async updateWorkOrder(
    workOrderId: string,
    workOrderData: WorkOrderUpdate,
  ): Promise<WorkOrder> {
    const response = await apiService.put(
      `${this.baseUrl}/${workOrderId}`,
      workOrderData,
    );
    return response;
  }

  async deleteWorkOrder(workOrderId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${workOrderId}`);
  }

  async getWorkOrderStats(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  getStatusColor(status: string): { bg: string; border: string } {
    const statusColors: Record<string, { bg: string; border: string }> = {
      draft: { bg: '#f3f4f6', border: '#6b7280' },
      planned: { bg: '#dbeafe', border: '#3b82f6' },
      in_progress: { bg: '#fef3c7', border: '#f59e0b' },
      on_hold: { bg: '#fde68a', border: '#f59e0b' },
      completed: { bg: '#d1fae5', border: '#10b981' },
      cancelled: { bg: '#fee2e2', border: '#ef4444' },
    };
    return statusColors[status] || { bg: '#f3f4f6', border: '#6b7280' };
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      planned: 'Planned',
      in_progress: 'In Progress',
      on_hold: 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
  }

  getPriorityColor(priority: string): { bg: string; border: string } {
    const priorityColors: Record<string, { bg: string; border: string }> = {
      low: { bg: '#d1fae5', border: '#10b981' },
      medium: { bg: '#dbeafe', border: '#3b82f6' },
      high: { bg: '#fde68a', border: '#f59e0b' },
      urgent: { bg: '#fee2e2', border: '#ef4444' },
    };
    return priorityColors[priority] || { bg: '#f3f4f6', border: '#6b7280' };
  }

  getPriorityLabel(priority: string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  getTypeIcon(type: string): string {
    const typeIcons: Record<string, string> = {
      production: '🏭',
      maintenance: '🔧',
      repair: '⚙️',
      installation: '📦',
      inspection: '🔍',
    };
    return typeIcons[type] || '📋';
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export default new WorkOrderService();
