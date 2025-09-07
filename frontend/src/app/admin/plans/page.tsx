"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { apiService } from "@/src/services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { 
  CreditCard, 
  DollarSign, 
  Users, 
  FolderOpen, 
  CheckCircle, 
  XCircle, 
  Edit,
  Search,
  Filter,
  Settings,
  Activity,
  TrendingUp,
  Package,
  Star,
  Zap
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  planType: string;
  price: number;
  billingCycle: string;
  maxProjects?: number;
  maxUsers?: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalSubscriptions: number;
}

export default function AdminPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user is super admin
  if (user?.userRole !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <Card className="w-96 mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
              <CardDescription className="text-center">
                You need super admin privileges to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  // Update stats whenever plans change
  useEffect(() => {
    fetchPlanStats();
  }, [plans]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/plans");
      setPlans(response.plans || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanStats = () => {
    try {
      // Calculate stats from plans data
      const totalPlans = plans.length;
      const activePlans = plans.filter(plan => plan.isActive).length;
      const inactivePlans = totalPlans - activePlans;
      
      setPlanStats({
        totalPlans,
        activePlans,
        inactivePlans,
        totalSubscriptions: 0 // This would need a separate API call
      });
    } catch (error) {
      console.error("Error calculating plan stats:", error);
    }
  };

  const handleActivatePlan = async (planId: string) => {
    try {
      await apiService.put(`/plans/${planId}/activate`);
      await fetchPlans(); // This will trigger stats recalculation via useEffect
    } catch (error) {
      console.error("Error activating plan:", error);
    }
  };

  const handleDeactivatePlan = async (planId: string) => {
    try {
      await apiService.put(`/plans/${planId}/deactivate`);
      await fetchPlans(); // This will trigger stats recalculation via useEffect
    } catch (error) {
      console.error("Error deactivating plan:", error);
    }
  };

  const handleUpdatePlan = async (planData: Partial<Plan>) => {
    if (!selectedPlan) return;
    
    try {
      setIsUpdating(true);
      await apiService.put(`/plans/${selectedPlan.id}`, planData);
      await fetchPlans(); // This will trigger stats recalculation via useEffect
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error updating plan:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                          (statusFilter === "active" && plan.isActive) ||
                          (statusFilter === "inactive" && !plan.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getPlanTypeIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case "starter":
        return <Star className="h-5 w-5 text-green-500" />;
      case "professional":
        return <Zap className="h-5 w-5 text-blue-500" />;
      case "enterprise":
        return <Package className="h-5 w-5 text-purple-500" />;
      case "commerce":
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case "workshop":
        return <Settings className="h-5 w-5 text-orange-500" />;
      case "healthcare":
        return <Activity className="h-5 w-5 text-blue-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanTypeColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case "starter":
        return "bg-green-100 text-green-800";
      case "professional":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "commerce":
        return "bg-emerald-100 text-emerald-800";
      case "workshop":
        return "bg-orange-100 text-orange-800";
      case "healthcare":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading plans...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan Management</h1>
          <p className="text-gray-600">Manage subscription plans and their availability</p>
        </div>

        {/* Stats Cards */}
        {planStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Plans</p>
                    <p className="text-2xl font-bold text-gray-900">{planStats.totalPlans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Plans</p>
                    <p className="text-2xl font-bold text-gray-900">{planStats.activePlans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive Plans</p>
                    <p className="text-2xl font-bold text-gray-900">{planStats.inactivePlans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{planStats.totalSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getPlanTypeIcon(plan.planType)}
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getPlanTypeColor(plan.planType)}>
                    {plan.planType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Price</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${plan.price}/{plan.billingCycle}
                    </span>
                  </div>

                  {/* Limits */}
                  <div className="space-y-2">
                    {plan.maxUsers && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Max Users</span>
                        </div>
                        <span className="text-sm font-medium">{plan.maxUsers}</span>
                      </div>
                    )}
                    {plan.maxProjects && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FolderOpen className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Max Projects</span>
                        </div>
                        <span className="text-sm font-medium">{plan.maxProjects}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Features</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{plan.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {plan.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        plan.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsEditDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {plan.isActive ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeactivatePlan(plan.id)}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleActivatePlan(plan.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPlans.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No plans have been created yet."
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Plan Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update the plan details and settings.
              </DialogDescription>
            </DialogHeader>
            
            {selectedPlan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Plan Name</label>
                    <Input
                      defaultValue={selectedPlan.name}
                      onChange={(e) => setSelectedPlan({...selectedPlan, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price</label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={selectedPlan.price}
                      onChange={(e) => setSelectedPlan({...selectedPlan, price: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Input
                    defaultValue={selectedPlan.description}
                    onChange={(e) => setSelectedPlan({...selectedPlan, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Billing Cycle</label>
                    <Select
                      defaultValue={selectedPlan.billingCycle}
                      onValueChange={(value) => setSelectedPlan({...selectedPlan, billingCycle: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max Users</label>
                    <Input
                      type="number"
                      defaultValue={selectedPlan.maxUsers || ""}
                      onChange={(e) => setSelectedPlan({...selectedPlan, maxUsers: parseInt(e.target.value) || undefined})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={selectedPlan.isActive}
                    onChange={(e) => setSelectedPlan({...selectedPlan, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Plan is active
                  </label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleUpdatePlan(selectedPlan)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Plan"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
