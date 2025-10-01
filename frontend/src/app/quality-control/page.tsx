'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Clock,
  Flag,
  Loader2,
  RefreshCw,
  CheckSquare,
  AlertTriangle,
  Play,
  Bug,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock3,
  FileCheck,
  BarChart,
  Calendar,
  Target,
} from 'lucide-react';
import {
  QualityCheckResponse as QualityCheck,
  QualityStatus,
  QualityPriority,
  getQualityStatusColor,
  getQualityPriorityColor,
} from '../../models/qualityControl';
import QualityControlService from '../../services/QualityControlService';
import { DashboardLayout } from '../../components/layout';
import { formatDate } from '../../lib/utils';

export default function QualityControlPage() {
  const { getCurrencySymbol } = useCurrency();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentChecks, setRecentChecks] = useState<QualityCheck[]>([]);
  const [upcomingChecks, setUpcomingChecks] = useState<QualityCheck[]>([]);
  const [criticalDefects, setCriticalDefects] = useState<any[]>([]);

  // Quality Checks data
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
    loadQualityChecks();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const service = new QualityControlService();
      const dashboard = await service.getQualityDashboard();
      setDashboardData(dashboard.stats);
      setRecentChecks(dashboard.recent_checks || []);
      setUpcomingChecks(dashboard.upcoming_checks || []);
      setCriticalDefects(dashboard.critical_defects || []);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const loadQualityChecks = async () => {
    try {
      const service = new QualityControlService();
      const response = await service.getQualityChecks();
      setQualityChecks(response.quality_checks);
    } catch (error) {
      }
  };

  const getStatusIcon = (status: QualityStatus) => {
    switch (status) {
      case QualityStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case QualityStatus.IN_PROGRESS:
        return <Play className="h-4 w-4" />;
      case QualityStatus.PASSED:
        return <CheckCircle className="h-4 w-4" />;
      case QualityStatus.FAILED:
        return <XCircle className="h-4 w-4" />;
      case QualityStatus.CONDITIONAL_PASS:
        return <AlertCircle className="h-4 w-4" />;
      case QualityStatus.REQUIRES_REVIEW:
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: QualityPriority) => {
    switch (priority) {
      case QualityPriority.LOW:
        return <Flag className="h-4 w-4 text-gray-500" />;
      case QualityPriority.MEDIUM:
        return <Flag className="h-4 w-4 text-blue-500" />;
      case QualityPriority.HIGH:
        return <Flag className="h-4 w-4 text-orange-500" />;
      case QualityPriority.CRITICAL:
        return <Flag className="h-4 w-4 text-red-500" />;
      default:
        return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quality Control
            </h1>
            <p className="text-muted-foreground">
              Manage quality checks, inspections, defects, and reports
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push('/quality-control/checks/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Quality Check
            </Button>
            <Button variant="outline" onClick={loadDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="checks">Quality Checks</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="defects">Defects</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Checks
                      </CardTitle>
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.total_checks || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Quality checks created
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Pending Checks
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.pending_checks || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Awaiting inspection
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Compliance Score
                      </CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.average_compliance_score || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average compliance
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Critical Defects
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData?.critical_defects || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Require immediate attention
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Recent Quality Checks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock3 className="h-5 w-5" />
                        Recent Quality Checks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentChecks.length > 0 ? (
                        recentChecks.map((check) => (
                          <div
                            key={check.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {check.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {check.id}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={getQualityStatusColor(check.status)}
                            >
                              {check.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No recent quality checks
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Checks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Upcoming Checks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingChecks.length > 0 ? (
                        upcomingChecks.map((check) => (
                          <div
                            key={check.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-100 rounded-full">
                                <Clock className="h-4 w-4 text-yellow-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {check.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {check.scheduled_date
                                    ? formatDate(check.scheduled_date)
                                    : 'Not scheduled'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">{check.priority}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No upcoming quality checks
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Critical Defects */}
                {criticalDefects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Critical Defects
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {criticalDefects.map((defect: any) => (
                          <div
                            key={defect.id}
                            className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-100 rounded-full">
                                <Bug className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {defect.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {defect.category} •{' '}
                                  {defect.location || 'No location'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-red-100 text-red-800">
                                {defect.severity}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getCurrencySymbol()}{defect.cost_impact}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Quality Checks Tab */}
          <TabsContent value="checks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Checks</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search quality checks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => router.push('/quality-control/checks/new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Check
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {qualityChecks.length > 0 ? (
                    qualityChecks.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <CheckSquare className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{check.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {check.id} • {check.inspection_type}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={getQualityStatusColor(check.status)}
                              >
                                {getStatusIcon(check.status)}
                                <span className="ml-1">
                                  {check.status.replace('_', ' ')}
                                </span>
                              </Badge>
                              <Badge
                                className={getQualityPriorityColor(
                                  check.priority,
                                )}
                              >
                                {getPriorityIcon(check.priority)}
                                <span className="ml-1">{check.priority}</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {check.completion_percentage}% Complete
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {check.scheduled_date
                                ? formatDate(check.scheduled_date)
                                : 'Not scheduled'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/quality-control/checks/${check.id}`,
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/quality-control/checks/${check.id}/edit`,
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No quality checks
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating your first quality check.
                      </p>
                      <div className="mt-6">
                        <Button
                          onClick={() =>
                            router.push('/quality-control/checks/new')
                          }
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          New Quality Check
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Inspections</CardTitle>
                <p className="text-muted-foreground">
                  View and manage quality inspections
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Inspections coming soon
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This feature is under development.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Defects Tab */}
          <TabsContent value="defects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Defects</CardTitle>
                <p className="text-muted-foreground">
                  Track and manage quality defects
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Bug className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Defects coming soon
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This feature is under development.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Reports</CardTitle>
                <p className="text-muted-foreground">
                  Generate and view quality reports
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Reports coming soon
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This feature is under development.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
