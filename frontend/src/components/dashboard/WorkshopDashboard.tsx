'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Factory,
  Wrench,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  BarChart3,
  Plus,
  Clock,
  Calendar,
  Activity,
  Settings,
  Target,
  Zap,
  DollarSign,
  Gauge,
  Layers,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface WorkshopStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  workOrders?: number;
  equipmentMaintenance?: number;
  qualityIssues?: number;
  productionEfficiency?: number;
}

interface WorkshopDashboardProps {
  stats: WorkshopStats;
  onNavigate: (path: string) => void;
}

export default function WorkshopDashboard({
  stats,
  onNavigate,
}: WorkshopDashboardProps) {
  const workOrders = stats.workOrders || 0;
  const equipmentMaintenance = stats.equipmentMaintenance || 0;
  const productionEfficiency = stats.productionEfficiency || 85;
  const qualityIssues = stats.qualityIssues || 0;
  
  const completionRate = stats.totalProjects > 0 
    ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
    : 0;

  const handleCreateProject = () => onNavigate('/projects/new');
  const handleCreateWorkOrder = () => onNavigate('/workshop-management/work-orders/new');
  const handleViewProduction = () => onNavigate('/workshop-management/production');
  const handleViewMaintenance = () => onNavigate('/workshop-management/maintenance');
  const handleAddInvestment = () => onNavigate('/ledger/investments/new');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Workshop Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time manufacturing operations & analytics
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCreateProject}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <Button
            onClick={handleCreateWorkOrder}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Work Order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {stats.activeProjects}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{stats.totalProjects} total projects</span>
              <Badge variant="secondary" className="text-xs">
                {completionRate}% complete
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Work Orders</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-600 mb-1">{workOrders}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>In queue</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Efficiency
            </CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {productionEfficiency}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={productionEfficiency} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">Target: 90%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Size</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats.totalTeamMembers}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Active members</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Production Analytics
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Performance metrics and insights
                  </CardDescription>
                </div>
                <Button
                  onClick={handleViewProduction}
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600"
                >
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-semibold text-indigo-600">
                    {stats.averageProgress}%
                  </span>
                </div>
                <Progress value={stats.averageProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg border border-indigo-200">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">
                    {stats.completedProjects}
                  </div>
                  <div className="text-xs font-medium text-indigo-700">Completed</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">+12%</span>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {workOrders}
                  </div>
                  <div className="text-xs font-medium text-blue-700">Work Orders</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">Pending</span>
                  </div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {productionEfficiency}%
                  </div>
                  <div className="text-xs font-medium text-emerald-700">Efficiency</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Gauge className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">On track</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Completion Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Progress value={completionRate} className="h-2" />
                    </div>
                    <span className="font-semibold">{completionRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Equipment & Maintenance
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Equipment status and maintenance schedule
                  </CardDescription>
                </div>
                <Button
                  onClick={handleViewMaintenance}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600"
                >
                  Manage
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Maintenance Due</span>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{equipmentMaintenance}</div>
                  <div className="text-xs text-blue-700 mt-1">Requires attention</div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-900">Operational</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {equipmentMaintenance > 0 ? Math.max(0, 10 - equipmentMaintenance) : 10}
                  </div>
                  <div className="text-xs text-emerald-700 mt-1">All systems normal</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Preventive Maintenance</span>
                  </div>
                  <Badge variant="outline" className="bg-white">Scheduled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Quality Issues</span>
                  </div>
                  <Badge variant="destructive">{qualityIssues}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleCreateWorkOrder}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-indigo-50 hover:border-indigo-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Wrench className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Create Work Order</div>
                    <div className="text-xs text-muted-foreground">New production task</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={() => onNavigate('/workshop-management/quality-control')}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Quality Control</div>
                    <div className="text-xs text-muted-foreground">Inspect products</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={() => onNavigate('/inventory')}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-blue-50 hover:border-blue-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Inventory</div>
                    <div className="text-xs text-muted-foreground">Stock management</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={handleAddInvestment}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-purple-50 hover:border-purple-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Add Investment</div>
                    <div className="text-xs text-muted-foreground">Track expenses</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={() => onNavigate('/reports')}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-pink-50 hover:border-pink-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">View Reports</div>
                    <div className="text-xs text-muted-foreground">Analytics & insights</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100">Today's Target</span>
                  <span className="font-bold text-lg">92%</span>
                </div>
                <Progress value={92} className="h-2 bg-indigo-400/30" />
                
                <div className="flex items-center justify-between pt-2 border-t border-indigo-400/30">
                  <span className="text-indigo-100">This Week</span>
                  <span className="font-bold">{productionEfficiency}%</span>
                </div>
                <Progress value={productionEfficiency} className="h-2 bg-indigo-400/30" />
                
                <div className="flex items-center justify-between pt-2 border-t border-indigo-400/30">
                  <span className="text-indigo-100">Monthly Goal</span>
                  <span className="font-bold">87%</span>
                </div>
                <Progress value={87} className="h-2 bg-indigo-400/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Recent Activity Summary
          </CardTitle>
          <CardDescription>Latest updates and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Projects Completed</span>
              </div>
              <div className="text-2xl font-bold text-indigo-600">{stats.completedProjects}</div>
              <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Active Operations</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeProjects}</div>
              <div className="text-xs text-muted-foreground mt-1">In progress now</div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Growth Rate</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">+15%</div>
              <div className="text-xs text-muted-foreground mt-1">Compared to last month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
