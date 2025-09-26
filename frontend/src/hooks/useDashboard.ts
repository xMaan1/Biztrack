import { useCachedApi } from './useCachedApi';
import { apiClient } from '../services/apiClient';

export interface DashboardData {
  projects: {
    stats: {
      total: number;
      active: number;
      completed: number;
      overdue: number;
    };
    recent: Array<{
      id: string;
      name: string;
      completionPercent: number;
      status: string;
      dueDate: string;
    }>;
  };
  workOrders: {
    stats: {
      total: number;
      draft: number;
      in_progress: number;
      completed: number;
    };
    recent: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      assignedTo: string;
    }>;
  };
  users: {
    total: number;
    active: number;
    recent: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      lastActive: string;
    }>;
  };
  financials: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    monthlyTrend: Array<{
      month: string;
      revenue: number;
      expenses: number;
    }>;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    recentMovements: Array<{
      id: string;
      itemName: string;
      type: string;
      quantity: number;
      timestamp: string;
    }>;
  };
  planInfo: {
    planType: string;
    features: string[];
  };
  timestamp?: string;
  tenant_id: string;
}

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearCache: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
  const { data, loading, error, refetch, clearCache } = useCachedApi<DashboardData>(
    'dashboard_overview',
    () => apiClient.get('/dashboard/overview'),
    { ttl: 30000 }
  );

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
};
