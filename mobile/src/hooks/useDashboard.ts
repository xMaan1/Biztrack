import { useState, useEffect } from 'react';
import { apiService } from '@/services/ApiService';

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
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get('/dashboard/overview');
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
      setData({
        projects: { stats: { total: 0, active: 0, completed: 0, overdue: 0 }, recent: [] },
        workOrders: { stats: { total: 0, draft: 0, in_progress: 0, completed: 0 }, recent: [] },
        users: { total: 0, active: 0, recent: [] },
        financials: { totalRevenue: 0, totalExpenses: 0, netIncome: 0, monthlyTrend: [] },
        inventory: { totalItems: 0, lowStock: 0, outOfStock: 0, recentMovements: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}

