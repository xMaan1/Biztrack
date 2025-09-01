"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Settings,
  FileText,
  HardDrive,
} from "lucide-react";
import { maintenanceService } from "@/src/services/MaintenanceService";
import {
  MaintenanceScheduleResponse,
  MaintenanceWorkOrderResponse,
  EquipmentResponse,
  MaintenanceReportResponse,
  MaintenanceDashboardStats,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceType,
  EquipmentStatus,
  MaintenanceCategory,
  getMaintenanceStatusColor,
  getMaintenancePriorityColor,
  getEquipmentStatusColor,
  getMaintenanceTypeIcon,
  formatMaintenanceDate,
  formatDuration,
} from "@/src/models/maintenance";
import { MaintenanceScheduleDialog } from "@/src/components/maintenance/MaintenanceScheduleDialog";
import { EquipmentDialog } from "@/src/components/maintenance/EquipmentDialog";

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] =
    useState<MaintenanceDashboardStats | null>(null);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<
    MaintenanceScheduleResponse[]
  >([]);
  const [maintenanceWorkOrders, setMaintenanceWorkOrders] = useState<
    MaintenanceWorkOrderResponse[]
  >([]);
  const [equipment, setEquipment] = useState<EquipmentResponse[]>([]);
  const [maintenanceReports, setMaintenanceReports] = useState<
    MaintenanceReportResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, schedules, workOrders, equipmentList, reports] =
        await Promise.all([
          maintenanceService.getMaintenanceDashboard(),
          maintenanceService.getMaintenanceSchedules(0, 10),
          maintenanceService.getMaintenanceWorkOrders(0, 10),
          maintenanceService.getEquipmentList(0, 10),
          maintenanceService.getMaintenanceReports(0, 10),
        ]);

      setDashboardStats(stats);
      setMaintenanceSchedules(schedules);
      setMaintenanceWorkOrders(workOrders);
      setEquipment(equipmentList);
      setMaintenanceReports(reports);
    } catch (error) {
      console.error("Failed to fetch maintenance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on search and filters
  const filteredSchedules = useMemo(() => {
    let filtered = maintenanceSchedules;

    if (searchQuery) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          schedule.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.maintenance_type === statusFilter,
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.priority === priorityFilter,
      );
    }

    return filtered;
  }, [maintenanceSchedules, searchQuery, statusFilter, priorityFilter]);

  const handleCreateMaintenance = () => {
    setShowCreateDialog(true);
  };

  const handleScheduleCreated = () => {
    // Refresh the data after creating a new schedule
    fetchDashboardData();
  };

  const handleEquipmentCreated = () => {
    // Refresh the data after creating new equipment
    fetchDashboardData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading maintenance data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Equipment Maintenance
            </h1>
            <p className="text-muted-foreground">
              Manage equipment maintenance schedules, work orders, and reports
            </p>
          </div>
          <Button
            onClick={handleCreateMaintenance}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Maintenance Schedule
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="schedules">Maintenance Schedules</TabsTrigger>
            <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Equipment
                  </CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats?.total_equipment || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.operational_equipment || 0} operational
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Scheduled Maintenance
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats?.scheduled_maintenance || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.overdue_maintenance || 0} overdue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardStats?.completed_maintenance || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.efficiency_score || 0}% efficiency
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Cost
                  </CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardStats?.total_cost?.toFixed(2) || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.uptime_percentage || 0}% uptime
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bars */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Uptime</CardTitle>
                  <CardDescription>Current operational status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uptime Percentage</span>
                      <span>{dashboardStats?.uptime_percentage || 0}%</span>
                    </div>
                    <Progress
                      value={dashboardStats?.uptime_percentage || 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Efficiency</CardTitle>
                  <CardDescription>
                    Completed vs scheduled maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Efficiency Score</span>
                      <span>{dashboardStats?.efficiency_score || 0}%</span>
                    </div>
                    <Progress
                      value={dashboardStats?.efficiency_score || 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Maintenance Schedules */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Maintenance Schedules</CardTitle>
                <CardDescription>
                  Latest scheduled maintenance activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceSchedules.slice(0, 5).map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getMaintenanceTypeIcon(schedule.maintenance_type)}
                        </span>
                        <div>
                          <p className="font-medium">{schedule.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatMaintenanceDate(schedule.scheduled_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={getMaintenancePriorityColor(
                            schedule.priority,
                          )}
                        >
                          {schedule.priority}
                        </Badge>
                        <Badge variant="outline">
                          {formatDuration(schedule.estimated_duration_hours)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Schedules Tab */}
          <TabsContent value="schedules" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedules</CardTitle>
                <CardDescription>
                  Manage and monitor maintenance schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search schedules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(MaintenanceType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {Object.values(MaintenancePriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedules List */}
                <div className="space-y-4">
                  {filteredSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">
                          {getMaintenanceTypeIcon(schedule.maintenance_type)}
                        </span>
                        <div>
                          <h3 className="font-medium">{schedule.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {schedule.description || "No description"}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatMaintenanceDate(schedule.scheduled_date)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(
                                schedule.estimated_duration_hours,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={getMaintenancePriorityColor(
                            schedule.priority,
                          )}
                        >
                          {schedule.priority}
                        </Badge>
                        <Badge variant="outline">{schedule.category}</Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Orders Tab */}
          <TabsContent value="work-orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Work Orders</CardTitle>
                <CardDescription>
                  Track work order progress and completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Work order management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Equipment Inventory</CardTitle>
                    <CardDescription>
                      Manage equipment assets and specifications
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowEquipmentDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Equipment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {equipment.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No equipment found. Add your first piece of equipment to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {equipment.map((eq) => (
                      <div
                        key={eq.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">
                            {getMaintenanceTypeIcon(eq.category as any)}
                          </span>
                          <div>
                            <h3 className="font-medium">{eq.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {eq.model || "No Model"} • {eq.manufacturer || "No Manufacturer"}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {eq.location || "No Location"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {eq.operating_hours.toFixed(1)}h operating
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getEquipmentStatusColor(eq.status as any)}>
                            {eq.status}
                          </Badge>
                          <Badge variant="outline">{eq.category}</Badge>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Reports</CardTitle>
                <CardDescription>
                  View and analyze maintenance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Report management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Maintenance Schedule Creation Dialog */}
      <MaintenanceScheduleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onScheduleCreated={handleScheduleCreated}
      />

      {/* Equipment Creation Dialog */}
      <EquipmentDialog
        open={showEquipmentDialog}
        onOpenChange={setShowEquipmentDialog}
        onEquipmentCreated={handleEquipmentCreated}
      />
    </DashboardLayout>
  );
}
