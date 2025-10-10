'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  Package,
  Activity,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { useReportsDashboard, useReportsSummary } from '../../hooks/useReports';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

export default function ReportsPage() {
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useReportsDashboard();
  const { loading: summaryLoading, error: summaryError } = useReportsSummary();
  const { formatCurrency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Debug logging
  console.log('=== REPORTS PAGE DEBUG ===');
  console.log('dashboardLoading:', dashboardLoading);
  console.log('summaryLoading:', summaryLoading);
  console.log('dashboardError:', dashboardError);
  console.log('summaryError:', summaryError);
  console.log('dashboardData:', dashboardData);
  console.log('formatCurrency:', formatCurrency);
  console.log('========================');

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting reports...');
  };


  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (dashboardLoading || summaryLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading reports...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (dashboardError || summaryError) {
    console.log('=== ERROR CONDITION TRIGGERED ===');
    console.log('dashboardError:', dashboardError);
    console.log('summaryError:', summaryError);
    console.log('================================');
    
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Reports</h2>
            <p className="text-gray-600">Unable to load reports data. Please try again later.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const workOrderData = dashboardData?.work_orders;
  const projectData = dashboardData?.projects;
  const hrmData = dashboardData?.hrm;
  const inventoryData = dashboardData?.inventory;
  const financialData = dashboardData?.financial;

  // Prepare chart data
  const workOrderStatusData = workOrderData ? [
    { name: 'Completed', value: workOrderData.completed_work_orders, color: '#00C49F' },
    { name: 'In Progress', value: workOrderData.in_progress_work_orders, color: '#0088FE' },
    { name: 'On Hold', value: workOrderData.on_hold_work_orders, color: '#FFBB28' },
    { name: 'Draft', value: workOrderData.draft_work_orders, color: '#FF8042' },
  ] : [];

  const monthlyTrendsData = dashboardData?.monthly_trends?.map(trend => ({
    month: new Date(trend.month).toLocaleDateString('en-US', { month: 'short' }),
    hours: trend.value,
    count: trend.count,
  })) || [];

  const departmentPerformanceData = dashboardData?.department_performance?.map(dept => ({
    name: dept.department,
    completionRate: dept.completion_rate,
    completedTasks: dept.completed_tasks,
    totalTasks: dept.total_tasks,
  })) || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights and analytics for your business
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button onClick={handleExport} className="modern-button">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(workOrderData?.total_work_orders || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Work Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(projectData?.total_projects || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(hrmData?.total_employees || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialData?.total_revenue || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Order Status Distribution */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Work Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={workOrderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Monthly Work Order Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completionRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialData?.total_revenue || 0)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(financialData?.total_expenses || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialData?.net_profit || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Work Order Metrics */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Work Order Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">{formatPercentage(workOrderData?.completion_rate || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Hours Logged</span>
                <span className="font-semibold">{formatNumber(workOrderData?.total_hours_logged || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Urgent Orders</span>
                <span className="font-semibold">{formatNumber(workOrderData?.urgent_work_orders || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Project Metrics */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Project Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-semibold">{formatNumber(projectData?.active_projects || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed Projects</span>
                <span className="font-semibold">{formatNumber(projectData?.completed_projects || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue Projects</span>
                <span className="font-semibold">{formatNumber(projectData?.overdue_projects || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Metrics */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Inventory Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Products</span>
                <span className="font-semibold">{formatNumber(inventoryData?.total_products || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Low Stock Items</span>
                <span className="font-semibold">{formatNumber(inventoryData?.low_stock_products || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Value</span>
                <span className="font-semibold">{formatCurrency(inventoryData?.total_stock_value || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recent_activities?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  No recent activities found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}