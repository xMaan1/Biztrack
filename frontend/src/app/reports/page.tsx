'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Target,
  Download,
  Wrench,
  Calendar,
} from 'lucide-react';
import { apiService } from '../../services/ApiService';
import { useCurrency } from '../../contexts/CurrencyContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DashboardData {
  work_orders: {
    total_work_orders: number;
    completed_work_orders: number;
    completion_rate: number;
    urgent_work_orders: number;
    total_hours_logged: number;
  };
  projects: {
    total_projects: number;
    active_projects: number;
    project_success_rate: number;
    average_project_progress: number;
  };
  hrm: {
    total_employees: number;
    active_employees: number;
    employee_retention_rate: number;
    departments: number;
  };
  inventory: {
    total_products: number;
    total_stock_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
  };
  financial: {
    total_revenue: number;
    net_profit: number;
    profit_margin: number;
    total_invoices: number;
  };
  pos: {
    total_transactions: number;
    total_sales: number;
    average_transaction_value: number;
  };
  monthly_trends: {
    projects: Array<{ month: string; count: number }>;
    work_orders: Array<{ month: string; count: number }>;
    revenue: Array<{ month: string; amount: number }>;
  };
  department_performance: Array<{
    department: string;
    employee_count: number;
    average_salary: number;
  }>;
}

export default function ReportsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    // Debounce the API call to avoid multiple requests while selecting dates
    const timeoutId = setTimeout(() => {
      // Only fetch data if both dates are selected or if dates are cleared
      if ((dateRange.startDate && dateRange.endDate) || (!dateRange.startDate && !dateRange.endDate)) {
        fetchDashboardData();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.append('start_date', dateRange.startDate.toISOString().split('T')[0]);
      }
      if (dateRange.endDate) {
        params.append('end_date', dateRange.endDate.toISOString().split('T')[0]);
      }
      
      const queryString = params.toString();
      const url = `/reports/dashboard${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get(url);
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };


  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('report_type', 'dashboard');
      params.append('format', 'json');
      
      if (dateRange.startDate) {
        params.append('start_date', dateRange.startDate.toISOString().split('T')[0]);
      }
      if (dateRange.endDate) {
        params.append('end_date', dateRange.endDate.toISOString().split('T')[0]);
      }
      
      const queryString = params.toString();
      const url = `/reports/export?${queryString}`;
      
      const response = await apiService.get(url);
      
      // Create filename with date range
      const startDateStr = dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : 'all';
      const endDateStr = dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : 'all';
      const filename = `reports-dashboard-${startDateStr}-to-${endDateStr}.json`;
      
      // Create and download file
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url_blob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_blob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_blob);
      
    } catch (error) {
      console.error('Failed to export reports:', error);
      setError('Failed to export reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={fetchDashboardData}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">No data available</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <DatePicker
                selectsRange={true}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={(dates) => {
                  const [start, end] = dates || [null, null];
                  setDateRange({ startDate: start, endDate: end });
                }}
                placeholderText="Select date range"
                className="border-none outline-none text-sm bg-transparent"
                dateFormat="MMM dd, yyyy"
                isClearable={true}
                clearButtonTitle="Clear date range"
              />
            </div>
            <Button 
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              {loading ? 'Exporting...' : 'Export'}
          </Button>
        </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Work Orders */}
          <Card className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.work_orders?.total_work_orders || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.work_orders?.completed_work_orders || 0} completed
              </p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="mr-2">
                  {(dashboardData.work_orders.completion_rate || 0).toFixed(1)}% complete
                </Badge>
                {(dashboardData.work_orders?.urgent_work_orders || 0) > 0 && (
                  <Badge variant="destructive">
                    {dashboardData.work_orders?.urgent_work_orders || 0} urgent
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.projects?.total_projects || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.projects?.active_projects || 0} active
              </p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary">
                  {(dashboardData.projects?.project_success_rate || 0).toFixed(1)}% success rate
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Employees */}
          <Card className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.hrm?.total_employees || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.hrm?.active_employees || 0} active
              </p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary">
                  {(dashboardData.hrm?.employee_retention_rate || 0).toFixed(1)}% retention
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="modern-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.financial?.total_revenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(dashboardData.financial?.net_profit || 0)} net profit
              </p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary">
                  {(dashboardData.financial?.profit_margin || 0).toFixed(1)}% margin
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Status */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Products</span>
                <span className="font-semibold">{formatNumber(dashboardData.inventory?.total_products || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stock Value</span>
                <span className="font-semibold">{formatCurrency(dashboardData.inventory?.total_stock_value || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Low Stock Items</span>
                <Badge variant={(dashboardData.inventory?.low_stock_items || 0) > 0 ? "destructive" : "secondary"}>
                  {dashboardData.inventory?.low_stock_items || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Out of Stock</span>
                <Badge variant={(dashboardData.inventory?.out_of_stock_items || 0) > 0 ? "destructive" : "secondary"}>
                  {dashboardData.inventory?.out_of_stock_items || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* POS Sales */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                POS Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Transactions</span>
                <span className="font-semibold">{formatNumber(dashboardData.pos?.total_transactions || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Sales</span>
                <span className="font-semibold">{formatCurrency(dashboardData.pos?.total_sales || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Transaction</span>
                <span className="font-semibold">{formatCurrency(dashboardData.pos?.average_transaction_value || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Department Performance */}
        {(dashboardData.department_performance?.length || 0) > 0 && (
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(dashboardData.department_performance || []).map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                      <div className="font-semibold">{dept.department}</div>
                      <div className="text-sm text-gray-600">{dept.employee_count} employees</div>
                  </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(dept.average_salary)}</div>
                      <div className="text-sm text-gray-600">avg salary</div>
                </div>
              </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trends */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Project Trends */}
              <div>
                <h4 className="font-semibold mb-3">Projects Created</h4>
                <div className="space-y-2">
                  {(dashboardData.monthly_trends?.projects || []).slice(-6).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                      <Badge variant="outline">{trend.count}</Badge>
              </div>
                  ))}
              </div>
              </div>

              {/* Work Order Trends */}
              <div>
                <h4 className="font-semibold mb-3">Work Orders</h4>
                <div className="space-y-2">
                  {(dashboardData.monthly_trends?.work_orders || []).slice(-6).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                      <Badge variant="outline">{trend.count}</Badge>
              </div>
                  ))}
              </div>
        </div>

              {/* Revenue Trends */}
              <div>
                <h4 className="font-semibold mb-3">Revenue</h4>
                <div className="space-y-2">
                  {(dashboardData.monthly_trends?.revenue || []).slice(-6).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{new Date(trend.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                      <Badge variant="outline">{formatCurrency(trend.amount)}</Badge>
                  </div>
                  ))}
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}