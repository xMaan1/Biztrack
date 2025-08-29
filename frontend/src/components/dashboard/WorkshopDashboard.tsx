"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Factory,
  Wrench,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  // Provide default values for optional stats
  const workOrders = stats.workOrders || 0;
  const equipmentMaintenance = stats.equipmentMaintenance || 0;
  const qualityIssues = stats.qualityIssues || 0;
  const productionEfficiency = stats.productionEfficiency || 0;

  const handleCreateProject = () => onNavigate("/projects/new");
  const handleCreateWorkOrder = () => onNavigate("/work-orders/new");
  const handleViewProduction = () => onNavigate("/production");
  const handleViewMaintenance = () => onNavigate("/maintenance");

  return (
    <div className="space-y-8">
      {/* Workshop-Specific Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Workshop Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manufacturing & Production Management Overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateProject}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <Button
            onClick={handleCreateWorkOrder}
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-50"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Work Order
          </Button>
        </div>
      </div>

      {/* Workshop-Specific Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Factory className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Orders</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{workOrders}</div>
            <p className="text-xs text-muted-foreground">
              Pending & in progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Production Efficiency
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productionEfficiency}%
            </div>
            <p className="text-xs text-muted-foreground">Target: 85%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalTeamMembers}
            </div>
            <p className="text-xs text-muted-foreground">Active workers</p>
          </CardContent>
        </Card>
      </div>

      {/* Workshop-Specific Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Production Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-orange-600" />
              Production Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {stats.averageProgress}%
              </span>
            </div>
            <Progress value={stats.averageProgress} className="h-2" />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.completedProjects}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {workOrders}
                </div>
                <div className="text-xs text-gray-600">Work Orders</div>
              </div>
            </div>

            <Button
              onClick={handleViewProduction}
              variant="outline"
              className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              View Production Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Equipment & Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              Equipment & Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Maintenance Due</span>
              <Badge variant="destructive">{equipmentMaintenance}</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm">Preventive Maintenance</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <span className="text-sm">Equipment Status</span>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>

            <Button
              onClick={handleViewMaintenance}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Manage Equipment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => onNavigate("/work-orders")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Wrench className="h-6 w-6" />
              <span className="text-sm">Work Orders</span>
            </Button>

            <Button
              onClick={() => onNavigate("/quality-control")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm">Quality Control</span>
            </Button>

            <Button
              onClick={() => onNavigate("/inventory")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Package className="h-6 w-6" />
              <span className="text-sm">Inventory</span>
            </Button>

            <Button
              onClick={() => onNavigate("/reports")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
