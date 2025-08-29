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
  Factory,
  AlertTriangle,
  Package,
  BarChart3,
  Play,
  Pause,
  Square,
  Wrench,
} from "lucide-react";
import {
  ProductionPlanResponse as ProductionPlan,
  ProductionStatus,
  ProductionPriority,
  ProductionType,
} from "../../models/production";
import ProductionService from "../../services/ProductionService";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../components/layout";
import ProductionPlanDialog from "../../components/production/ProductionPlanDialog";
import {
  cn,
  getStatusColor,
  getPriorityColor,
  getInitials,
  formatDate,
} from "../../lib/utils";

export default function ProductionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<ProductionPlan | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [activeTab, setActiveTab] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProductionPlans();
    }
  }, [mounted]);

  useEffect(() => {
    filterProductionPlans();
  }, [
    productionPlans,
    searchTerm,
    statusFilter,
    priorityFilter,
    typeFilter,
    sortBy,
  ]);

  const fetchProductionPlans = async () => {
    try {
      setLoading(true);
      const service = new ProductionService();
      const response = await service.getProductionPlans();
      setProductionPlans(response.production_plans);
    } catch (error) {
      console.error("Error fetching production plans:", error);
      setProductionPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProductionPlans = () => {
    let filtered = [...productionPlans];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (plan) =>
          plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.plan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (plan.description &&
            plan.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((plan) => plan.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((plan) => plan.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((plan) => plan.production_type === typeFilter);
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
          const priorityOrder: Record<string, number> = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        break;
      case "deadline":
        filtered.sort((a, b) => {
          if (!a.planned_end_date && !b.planned_end_date) return 0;
          if (!a.planned_end_date) return 1;
          if (!b.planned_end_date) return -1;
          return (
            new Date(a.planned_end_date).getTime() -
            new Date(b.planned_end_date).getTime()
          );
        });
        break;
    }

    setFilteredPlans(filtered);
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeletePlan = (plan: ProductionPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      const service = new ProductionService();
      await service.deleteProductionPlan(planToDelete.id);
      setProductionPlans(
        productionPlans.filter((plan) => plan.id !== planToDelete.id),
      );
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error("Error deleting production plan:", error);
    }
  };

  const handleViewPlan = (plan: ProductionPlan) => {
    router.push(`/production/${plan.id}`);
  };

  const getStatusIcon = (status: ProductionStatus) => {
    switch (status) {
      case ProductionStatus.PLANNED:
        return <Clock className="h-4 w-4" />;
      case ProductionStatus.IN_PROGRESS:
        return <Play className="h-4 w-4" />;
      case ProductionStatus.ON_HOLD:
        return <Pause className="h-4 w-4" />;
      case ProductionStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4" />;
      case ProductionStatus.CANCELLED:
        return <Square className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: ProductionType) => {
    switch (type) {
      case ProductionType.BATCH:
        return <Package className="h-4 w-4" />;
      case ProductionType.CONTINUOUS:
        return <Factory className="h-4 w-4" />;
      case ProductionType.JOB_SHOP:
        return <Wrench className="h-4 w-4" />;
      case ProductionType.ASSEMBLY:
        return <CheckSquare className="h-4 w-4" />;
      case ProductionType.CUSTOM:
        return <Star className="h-4 w-4" />;
      default:
        return <Factory className="h-4 w-4" />;
    }
  };

  if (!mounted) return null;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Production Planning
            </h1>
            <p className="text-gray-600 mt-2">
              Manage manufacturing and production plans
            </p>
          </div>
          <Button
            onClick={handleCreatePlan}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Production Plan
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
                    placeholder="Search production plans..."
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
                    <SelectItem value={ProductionStatus.PLANNED}>
                      Planned
                    </SelectItem>
                    <SelectItem value={ProductionStatus.IN_PROGRESS}>
                      In Progress
                    </SelectItem>
                    <SelectItem value={ProductionStatus.ON_HOLD}>
                      On Hold
                    </SelectItem>
                    <SelectItem value={ProductionStatus.COMPLETED}>
                      Completed
                    </SelectItem>
                    <SelectItem value={ProductionStatus.CANCELLED}>
                      Cancelled
                    </SelectItem>
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
                    <SelectItem value={ProductionPriority.LOW}>Low</SelectItem>
                    <SelectItem value={ProductionPriority.MEDIUM}>
                      Medium
                    </SelectItem>
                    <SelectItem value={ProductionPriority.HIGH}>
                      High
                    </SelectItem>
                    <SelectItem value={ProductionPriority.URGENT}>
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={ProductionType.BATCH}>Batch</SelectItem>
                    <SelectItem value={ProductionType.CONTINUOUS}>
                      Continuous
                    </SelectItem>
                    <SelectItem value={ProductionType.JOB_SHOP}>
                      Job Shop
                    </SelectItem>
                    <SelectItem value={ProductionType.ASSEMBLY}>
                      Assembly
                    </SelectItem>
                    <SelectItem value={ProductionType.CUSTOM}>
                      Custom
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
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
              All Plans ({filteredPlans.length})
            </TabsTrigger>
            <TabsTrigger value="planned">
              Planned (
              {
                productionPlans.filter(
                  (p) => p.status === ProductionStatus.PLANNED,
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress (
              {
                productionPlans.filter(
                  (p) => p.status === ProductionStatus.IN_PROGRESS,
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed (
              {
                productionPlans.filter(
                  (p) => p.status === ProductionStatus.COMPLETED,
                ).length
              }
              )
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Production Plans List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No production plans found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                statusFilter !== "all" ||
                priorityFilter !== "all" ||
                typeFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by creating your first production plan"}
              </p>
              {!searchTerm &&
                statusFilter === "all" &&
                priorityFilter === "all" &&
                typeFilter === "all" && (
                  <Button onClick={handleCreatePlan}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Production Plan
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(plan.status)}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getStatusColor(plan.status),
                            )}
                          >
                            {plan.status.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getPriorityColor(plan.priority),
                            )}
                          >
                            {plan.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getTypeIcon(plan.production_type)}
                            {plan.production_type}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500 font-mono">
                          {plan.plan_number}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {plan.title}
                      </h3>

                      {plan.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {plan.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Target:</span>
                          <div className="font-medium">
                            {plan.target_quantity} {plan.unit_of_measure}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Progress:</span>
                          <div className="font-medium">
                            {plan.completion_percentage}%
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <div className="font-medium">
                            {plan.estimated_duration_hours}h
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Cost:</span>
                          <div className="font-medium">
                            $
                            {plan.estimated_material_cost +
                              plan.estimated_labor_cost}
                          </div>
                        </div>
                      </div>

                      <Progress
                        value={plan.completion_percentage}
                        className="mb-3"
                      />

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {plan.planned_start_date && (
                          <span>
                            Start: {formatDate(plan.planned_start_date)}
                          </span>
                        )}
                        {plan.planned_end_date && (
                          <span>End: {formatDate(plan.planned_end_date)}</span>
                        )}
                        <span>Created: {formatDate(plan.created_at)}</span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewPlan(plan)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePlan(plan)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

        {/* Production Plan Dialog */}
        <ProductionPlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          plan={selectedPlan}
          onSuccess={() => {
            setDialogOpen(false);
            fetchProductionPlans();
          }}
        />

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <Alert className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <AlertDescription className="bg-white p-6 rounded-lg shadow-xl max-w-md">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Production Plan
                </h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete "{planToDelete?.title}"? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDeletePlan}>
                    Delete
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}
