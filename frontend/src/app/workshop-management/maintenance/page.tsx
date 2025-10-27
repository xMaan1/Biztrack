'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/src/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/src/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { Progress } from '@/src/components/ui/progress';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import {
  Clock,
  CheckCircle,
  Plus,
  Search,
  Settings,
  FileText,
  HardDrive,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { maintenanceService } from '@/src/services/MaintenanceService';
import {
  MaintenanceScheduleResponse,
  EquipmentResponse,
  MaintenanceDashboardStats,
  MaintenancePriority,
  MaintenanceType,
  getMaintenancePriorityColor,
  getEquipmentStatusColor,
  getMaintenanceTypeIcon,
  formatMaintenanceDate,
  formatDuration,
} from '@/src/models/maintenance';
import { MaintenanceScheduleDialog } from '@/src/components/maintenance/MaintenanceScheduleDialog';
import { EquipmentDialog } from '@/src/components/maintenance/EquipmentDialog';

export default function MaintenancePage() {
  const { getCurrencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] =
    useState<MaintenanceDashboardStats | null>(null);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<
    MaintenanceScheduleResponse[]
  >([]);
  const [equipment, setEquipment] = useState<EquipmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<MaintenanceScheduleResponse | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<EquipmentResponse | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentResponse | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    manufacturer: '',
    category: 'machinery' as any,
    location: '',
    status: 'operational' as any,
    installation_date: '',
    warranty_expiry: '',
    maintenance_interval_hours: 0,
    operating_hours: 0,
    operating_instructions: '',
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, schedules, equipmentList] =
        await Promise.all([
          maintenanceService.getMaintenanceDashboard(),
          maintenanceService.getMaintenanceSchedules(0, 10),
          maintenanceService.getEquipmentList(0, 10),
        ]);

      setDashboardStats(stats);
      setMaintenanceSchedules(schedules);
      setEquipment(equipmentList);
    } catch (error) {
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (schedule) => schedule.maintenance_type === statusFilter,
      );
    }

    if (priorityFilter !== 'all') {
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

  const handleEditSchedule = (schedule: MaintenanceScheduleResponse) => {
    // TODO: Implement edit functionality
    console.log('Edit schedule:', schedule);
  };

  const openViewModal = (equipment: EquipmentResponse) => {
    setSelectedEquipment(equipment);
    setIsViewModalOpen(true);
  };

  const openEditModal = (equipment: EquipmentResponse) => {
    setSelectedEquipment(equipment);
    setEditFormData({
      name: equipment.name || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      manufacturer: equipment.manufacturer || '',
      category: equipment.category || 'machinery',
      location: equipment.location || '',
      status: equipment.status || 'operational',
      installation_date: equipment.installation_date ? equipment.installation_date.split('T')[0] : '',
      warranty_expiry: equipment.warranty_expiry ? equipment.warranty_expiry.split('T')[0] : '',
      maintenance_interval_hours: equipment.maintenance_interval_hours || 0,
      operating_hours: equipment.operating_hours || 0,
      operating_instructions: equipment.operating_instructions || '',
      tags: equipment.tags || [],
    });
    setIsEditModalOpen(true);
  };

  const handleEditEquipment = (equipment: EquipmentResponse) => {
    openEditModal(equipment);
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipment) return;

    try {
      setIsSubmitting(true);
      await maintenanceService.updateEquipment(selectedEquipment.id, editFormData);
      setIsEditModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating equipment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = (schedule: MaintenanceScheduleResponse) => {
    setDeletingSchedule(schedule);
    setShowDeleteDialog(true);
  };

  const handleDeleteEquipment = (equipment: EquipmentResponse) => {
    setDeletingEquipment(equipment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      if (deletingSchedule) {
        await maintenanceService.deleteMaintenanceSchedule(deletingSchedule.id);
        setMaintenanceSchedules(maintenanceSchedules.filter(s => s.id !== deletingSchedule.id));
      } else if (deletingEquipment) {
        await maintenanceService.deleteEquipment(deletingEquipment.id);
        setEquipment(equipment.filter(e => e.id !== deletingEquipment.id));
      }
      setShowDeleteDialog(false);
      setDeletingSchedule(null);
      setDeletingEquipment(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
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
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Equipment Maintenance
            </h1>
            <p className="text-gray-600 mt-2">
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
                    {getCurrencySymbol()}{dashboardStats?.total_cost?.toFixed(2) || '0.00'}
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
                            {schedule.description || 'No description'}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSchedule(schedule)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                              {eq.model || 'No Model'} • {eq.manufacturer || 'No Manufacturer'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {eq.location || 'No Location'}
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewModal(eq)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditEquipment(eq)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteEquipment(eq)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              {deletingSchedule ? `"${deletingSchedule.title}"` : `"${deletingEquipment?.name}"`}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingSchedule(null);
                  setDeletingEquipment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Equipment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipment Details</DialogTitle>
            <DialogDescription>
              View complete information for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Equipment Name</Label>
                    <p className="text-sm">{selectedEquipment.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Equipment ID</Label>
                    <p className="text-sm">{selectedEquipment.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <p className="text-sm">{selectedEquipment.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge className={getEquipmentStatusColor(selectedEquipment.status as any)}>
                      {selectedEquipment.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Location</Label>
                    <p className="text-sm">{selectedEquipment.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Manufacturer</Label>
                    <p className="text-sm">{selectedEquipment.manufacturer || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Technical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Technical Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Model</Label>
                    <p className="text-sm">{selectedEquipment.model || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Serial Number</Label>
                    <p className="text-sm">{selectedEquipment.serial_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Purchase Date</Label>
                    <p className="text-sm">{selectedEquipment.installation_date || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Warranty Expiry</Label>
                    <p className="text-sm">{selectedEquipment.warranty_expiry || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Maintenance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Maintenance Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Maintenance</Label>
                    <p className="text-sm">{selectedEquipment.last_maintenance_date || 'Never'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Next Maintenance</Label>
                    <p className="text-sm">{selectedEquipment.next_maintenance_date || 'Not scheduled'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Maintenance Interval</Label>
                    <p className="text-sm">{selectedEquipment.maintenance_interval_hours ? `${selectedEquipment.maintenance_interval_hours} hours` : 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Operating Hours</Label>
                    <p className="text-sm">{selectedEquipment.operating_hours || 0} hours</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="text-sm">{selectedEquipment.specifications?.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Location</Label>
                    <p className="text-sm">{selectedEquipment.location || 'No location specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update information for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Equipment Name *</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model">Model</Label>
                  <Input
                    id="edit-model"
                    value={editFormData.model}
                    onChange={(e) => handleEditFormChange('model', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-serial">Serial Number</Label>
                  <Input
                    id="edit-serial"
                    value={editFormData.serial_number}
                    onChange={(e) => handleEditFormChange('serial_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                  <Input
                    id="edit-manufacturer"
                    value={editFormData.manufacturer}
                    onChange={(e) => handleEditFormChange('manufacturer', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editFormData.category}
                    onValueChange={(value) => handleEditFormChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="machinery">Machinery</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editFormData.location}
                    onChange={(e) => handleEditFormChange('location', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => handleEditFormChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="out_of_order">Out of Order</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates and Maintenance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dates & Maintenance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-installation-date">Installation Date</Label>
                  <Input
                    id="edit-installation-date"
                    type="date"
                    value={editFormData.installation_date}
                    onChange={(e) => handleEditFormChange('installation_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-warranty-expiry">Warranty Expiry</Label>
                  <Input
                    id="edit-warranty-expiry"
                    type="date"
                    value={editFormData.warranty_expiry}
                    onChange={(e) => handleEditFormChange('warranty_expiry', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maintenance-interval">Maintenance Interval (Hours)</Label>
                  <Input
                    id="edit-maintenance-interval"
                    type="number"
                    min="0"
                    value={editFormData.maintenance_interval_hours}
                    onChange={(e) => handleEditFormChange('maintenance_interval_hours', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-operating-hours">Operating Hours</Label>
                  <Input
                    id="edit-operating-hours"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editFormData.operating_hours}
                    onChange={(e) => handleEditFormChange('operating_hours', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-operating-instructions">Operating Instructions</Label>
                  <Textarea
                    id="edit-operating-instructions"
                    value={editFormData.operating_instructions}
                    onChange={(e) => handleEditFormChange('operating_instructions', e.target.value)}
                    rows={4}
                    placeholder="Enter operating instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Equipment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
