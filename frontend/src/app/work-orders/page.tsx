"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Progress } from "../../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  Star,
  Clock,
  Flag,
  CheckCircle2,
  Users,
  FolderOpen,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  CheckSquare,
  Wrench,
  Factory,
  AlertTriangle,
  Package,
  BarChart3,
} from "lucide-react";
import { apiService } from "../../services/ApiService";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../components/layout";
import WorkOrderDialog from "../../components/work-orders/WorkOrderDialog";
import {
  cn,
  getStatusColor,
  getPriorityColor,
  getStatusIcon,
  getTypeIcon,
  formatDate,
} from "../../lib/utils";

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description: string;
  work_order_type: string;
  status: string;
  priority: string;
  planned_start_date: string;
  planned_end_date: string;
  estimated_hours: number;
  actual_hours: number;
  completion_percentage: number;
  assigned_to_id: string;
  project_id: string;
  location: string;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
  updated_at: string;
}

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(
    null,
  );
  const [sortBy, setSortBy] = useState<string>("newest");
  const [activeTab, setActiveTab] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchWorkOrders();
    }
  }, [mounted]);

  useEffect(() => {
    filterWorkOrders();
  }, [
    workOrders,
    searchTerm,
    statusFilter,
    priorityFilter,
    typeFilter,
    sortBy,
  ]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWorkOrders();
      console.log("API Response:", response);
      setWorkOrders(response);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterWorkOrders = () => {
    console.log("Filtering work orders:", workOrders);
    let filtered = [...workOrders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (wo) =>
          wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.work_order_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          wo.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((wo) => wo.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((wo) => wo.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((wo) => wo.work_order_type === typeFilter);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "priority":
        filtered.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          );
        });
        break;
      case "due_date":
        filtered.sort(
          (a, b) =>
            new Date(a.planned_end_date).getTime() -
            new Date(b.planned_end_date).getTime(),
        );
        break;
    }

    setFilteredWorkOrders(filtered);
  };

  const handleCreateWorkOrder = () => {
    setSelectedWorkOrder(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteWorkOrder = (workOrder: WorkOrder) => {
    setWorkOrderToDelete(workOrder);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteWorkOrder = async () => {
    if (!workOrderToDelete) return;

    try {
      await apiService.deleteWorkOrder(workOrderToDelete.id);
      setWorkOrders(workOrders.filter((wo) => wo.id !== workOrderToDelete.id));
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting work order:", error);
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600 mt-2">
              Manage manufacturing and production work orders
            </p>
          </div>
          <Button
            onClick={handleCreateWorkOrder}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Work Order
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search work orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="due_date">Due Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({filteredWorkOrders.length})
            </TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="on_hold">On Hold</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Work Orders List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No work orders found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  priorityFilter !== "all" ||
                  typeFilter !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "Get started by creating your first work order."}
                </p>
                {!searchTerm &&
                  statusFilter === "all" &&
                  priorityFilter === "all" &&
                  typeFilter === "all" && (
                    <Button onClick={handleCreateWorkOrder}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Work Order
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredWorkOrders.map((workOrder) => (
              <Card
                key={workOrder.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getTypeIcon(workOrder.work_order_type)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {workOrder.work_order_type}
                          </span>
                        </div>
                        <Badge variant={getStatusColor(workOrder.status)}>
                          <span className="mr-1">
                            {getStatusIcon(workOrder.status)}
                          </span>
                          <span className="capitalize">
                            {workOrder.status.replace("_", " ")}
                          </span>
                        </Badge>
                        <Badge className={getPriorityColor(workOrder.priority)}>
                          {workOrder.priority}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {workOrder.work_order_number} - {workOrder.title}
                      </h3>

                      {workOrder.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {workOrder.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                        {workOrder.location && (
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {workOrder.location}
                          </span>
                        )}
                        {workOrder.planned_start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(workOrder.planned_start_date)}
                          </span>
                        )}
                        {workOrder.estimated_hours > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {workOrder.estimated_hours}h
                          </span>
                        )}
                        {workOrder.estimated_cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />$
                            {workOrder.estimated_cost}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{workOrder.completion_percentage}%</span>
                        </div>
                        <Progress
                          value={workOrder.completion_percentage}
                          className="h-2"
                        />
                      </div>
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
                            router.push(`/work-orders/${workOrder.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditWorkOrder(workOrder)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteWorkOrder(workOrder)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Work Order Dialog */}
        <WorkOrderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          workOrder={selectedWorkOrder}
          onSuccess={fetchWorkOrders}
        />

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Work Order
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{workOrderToDelete?.title}"?
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setWorkOrderToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteWorkOrder}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
