import { apiClient } from './apiClient';

export interface WorkOrderMetrics {
  total_work_orders: number;
  completed_work_orders: number;
  in_progress_work_orders: number;
  on_hold_work_orders: number;
  draft_work_orders: number;
  urgent_work_orders: number;
  average_completion_time: number;
  total_hours_logged: number;
  completion_rate: number;
}

export interface ProjectMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  overdue_projects: number;
  total_project_value: number;
  average_project_duration: number;
}

export interface HRMMetrics {
  total_employees: number;
  active_employees: number;
  total_job_postings: number;
  active_job_postings: number;
  pending_applications: number;
  pending_leave_requests: number;
}

export interface InventoryMetrics {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_warehouses: number;
  total_stock_value: number;
  pending_purchase_orders: number;
}

export interface FinancialMetrics {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  outstanding_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
}

export interface MonthlyTrend {
  month: string;
  value: number;
  count: number;
}

export interface DepartmentPerformance {
  department: string;
  completed_tasks: number;
  total_tasks: number;
  completion_rate: number;
  average_time: number;
}

export interface ReportsDashboard {
  work_orders: WorkOrderMetrics;
  projects: ProjectMetrics;
  hrm: HRMMetrics;
  inventory: InventoryMetrics;
  financial: FinancialMetrics;
  monthly_trends: MonthlyTrend[];
  department_performance: DepartmentPerformance[];
  recent_activities: any[];
}

export interface ReportsSummary {
  total_work_orders: number;
  completed_work_orders: number;
  completion_rate: number;
  total_projects: number;
  active_projects: number;
  total_employees: number;
  active_employees: number;
  total_revenue: number;
  net_profit: number;
  total_stock_value: number;
}

export interface WorkOrderAnalytics {
  total_work_orders: number;
  status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  type_distribution: Record<string, number>;
  total_hours: number;
  total_cost: number;
  average_hours_per_order: number;
  average_cost_per_order: number;
}

export interface ProjectAnalytics {
  total_projects: number;
  status_distribution: Record<string, number>;
  total_budget: number;
  average_budget: number;
  average_duration: number;
}

export interface FinancialAnalytics {
  revenue_by_month: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
  expenses_by_month: Array<{
    month: string;
    expenses: number;
    count: number;
  }>;
}

class ReportsService {
  async getDashboard(): Promise<ReportsDashboard> {
    try {
      const response = await apiClient.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSummary(): Promise<ReportsSummary> {
    try {
      const response = await apiClient.get('/reports/summary');
      return response.summary;
    } catch (error) {
      throw error;
    }
  }

  async getWorkOrderAnalytics(filters?: {
    start_date?: string;
    end_date?: string;
    user_id?: string;
  }): Promise<WorkOrderAnalytics> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.user_id) params.append('user_id', filters.user_id);

    const response = await apiClient.get(`/reports/work-orders/analytics?${params.toString()}`);
    return response.data.data;
  }

  async getProjectAnalytics(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ProjectAnalytics> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await apiClient.get(`/reports/projects/analytics?${params.toString()}`);
    return response.data.data;
  }

  async getFinancialAnalytics(filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FinancialAnalytics> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await apiClient.get(`/reports/financial/analytics?${params.toString()}`);
    return response.data.data;
  }

  async exportReports(
    reportType: string,
    format: string = 'json',
    filters?: {
      start_date?: string;
      end_date?: string;
    }
  ) {
    const params = new URLSearchParams();
    params.append('report_type', reportType);
    params.append('format', format);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await apiClient.get(`/reports/export?${params.toString()}`);
    return response.data;
  }
}

export const reportsService = new ReportsService();
