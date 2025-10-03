'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import {
  Factory,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Square,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  ProductionDashboard,
} from '../../../models/production';
import ProductionService from '../../../services/ProductionService';
import { useAuth } from '../../../hooks/useAuth';
import { DashboardLayout } from '../../../components/layout';
import { useRouter } from 'next/navigation';
import {
  cn,
  getStatusColor,
  getPriorityColor,
  formatDate,
} from '../../../lib/utils';

export default function ProductionDashboardPage() {
  const { } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ProductionDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const service = new ProductionService();
      const data = await service.getProductionDashboard();
      setDashboard(data);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'on_hold':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <Square className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Clock className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No production data available
          </h3>
          <p className="text-gray-500">
            Start by creating your first production plan.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Production Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Overview of your manufacturing and production operations
            </p>
          </div>
          <Button
            onClick={() => router.push('/production')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View All Plans
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.stats.total_plans}
              </div>
              <p className="text-xs text-muted-foreground">
                All production plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.stats.completion_rate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Plans completed successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.stats.in_progress_plans}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.stats.planned_plans}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled for future
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>
                Breakdown of production plans by status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(dashboard.stats.status_counts).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(count / dashboard.stats.total_plans) * 100}
                        className="w-20"
                      />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>
                Breakdown of production plans by priority
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(dashboard.stats.priority_counts).map(
                ([priority, count]) => (
                  <div
                    key={priority}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(priority)}
                      <span className="capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(count / dashboard.stats.total_plans) * 100}
                        className="w-20"
                      />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Plans */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Production Plans</CardTitle>
            <CardDescription>Latest production plans created</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recent_plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent production plans
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.recent_plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(plan.status)}
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getStatusColor(plan.status))}
                        >
                          {plan.status.replace('_', ' ')}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            getPriorityColor(plan.priority),
                          )}
                        >
                          {plan.priority}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{plan.title}</h4>
                        <p className="text-sm text-gray-500">
                          {plan.plan_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Target: {plan.target_quantity} {plan.unit_of_measure}
                      </span>
                      <span>Progress: {plan.completion_percentage}%</span>
                      <span>Created: {formatDate(plan.created_at)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/production/${plan.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>
              Production plans ending in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.upcoming_deadlines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No upcoming deadlines
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.upcoming_deadlines.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <Badge variant="outline" className="text-xs">
                          {plan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{plan.title}</h4>
                        <p className="text-sm text-gray-500">
                          Due:{' '}
                          {plan.planned_end_date
                            ? formatDate(plan.planned_end_date)
                            : 'No deadline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Progress: {plan.completion_percentage}%</span>
                      <Progress
                        value={plan.completion_percentage}
                        className="w-20"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/production/${plan.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Alerts</CardTitle>
            <CardDescription>
              High and urgent priority production plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.priority_alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No priority alerts
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.priority_alerts.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-red-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive" className="text-xs">
                          {plan.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {plan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{plan.title}</h4>
                        <p className="text-sm text-gray-500">
                          {plan.plan_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Progress: {plan.completion_percentage}%</span>
                      <Progress
                        value={plan.completion_percentage}
                        className="w-20"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/production/${plan.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
