'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiService } from '@/src/services/ApiService';
import { DashboardLayout } from '../../../components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { Plan, PlanStats } from '@/src/models/admin';
import {
  PageHeader,
  SearchFilterBar,
  FormModal,
  ErrorHandlerProvider,
  useAsyncErrorHandler
} from '../../../components/common';
import {
  CreditCard,
  DollarSign,
  Users,
  FolderOpen,
  CheckCircle,
  XCircle,
  Edit,
  Settings,
  Activity,
  Package,
  Star,
  Zap,
} from 'lucide-react';

function AdminPlansPageContent() {
  const { user } = useAuth();
  const { getCurrencySymbol } = useCurrency();
  const { handleAsync, showSuccess, showError } = useAsyncErrorHandler();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (user?.userRole !== 'super_admin') {
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

  useEffect(() => {
    fetchPlanStats();
  }, [plans]);

  const fetchPlans = async () => {
    await handleAsync(async () => {
      setLoading(true);
      const response = await apiService.get('/plans');
      setPlans(response.plans || []);
    }, 'Failed to load plans. Please try again.');

    setLoading(false);
  };

  const fetchPlanStats = () => {
    try {
      const totalPlans = plans.length;
      const activePlans = plans.filter(plan => plan.isActive).length;
      const inactivePlans = totalPlans - activePlans;

      setPlanStats({
        totalPlans,
        activePlans,
        inactivePlans,
        totalSubscriptions: 0, 
      });
    } catch (error) {
      showError('Failed to calculate plan statistics', 'toast');
    }
  };

  const handleActivatePlan = async (planId: string) => {
    await handleAsync(async () => {
      await apiService.put(`/plans/${planId}/activate`);
      showSuccess('Plan activated successfully');
      await fetchPlans(); 
    }, 'Failed to activate plan. Please try again.');
  };

  const handleDeactivatePlan = async (planId: string) => {
    await handleAsync(async () => {
      await apiService.put(`/plans/${planId}/deactivate`);
      showSuccess('Plan deactivated successfully');
      await fetchPlans(); 
    }, 'Failed to deactivate plan. Please try again.');
  };

  const handleUpdatePlan = async (planData: Partial<Plan>) => {
    if (!selectedPlan) return;

    await handleAsync(async () => {
      setIsUpdating(true);
      await apiService.put(`/plans/${selectedPlan.id}`, planData);
      showSuccess('Plan updated successfully');
      await fetchPlans(); // This will trigger stats recalculation via useEffect
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
    }, 'Failed to update plan. Please try again.');

    setIsUpdating(false);
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'active' && plan.isActive) ||
                          (statusFilter === 'inactive' && !plan.isActive);

    return matchesSearch && matchesStatus;
  });

  const getPlanTypeIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'starter':
        return <Star className="h-5 w-5 text-green-500" />;
      case 'professional':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'enterprise':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'commerce':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'workshop':
        return <Settings className="h-5 w-5 text-orange-500" />;
      case 'healthcare':
        return <Activity className="h-5 w-5 text-blue-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanTypeColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'starter':
        return 'bg-green-100 text-green-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'commerce':
        return 'bg-emerald-100 text-emerald-800';
      case 'workshop':
        return 'bg-orange-100 text-orange-800';
      case 'healthcare':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <PageHeader
          title="Plan Management"
          description="Manage subscription plans and their availability"
        />

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

        <SearchFilterBar
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search plans..."
          filters={[
            {
              key: 'status',
              label: 'Filter by status',
              options: [
                { value: 'all', label: 'All Plans' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive Only' }
              ]
            }
          ]}
          onFilterChange={(key, value) => {
            if (key === 'status') {
              setStatusFilter(value);
            }
          }}
        />

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
                      {getCurrencySymbol()}{plan.price}/{plan.billingCycle}
                    </span>
                  </div>

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
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No plans have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        <FormModal
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Edit Plan"
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedPlan) {
              handleUpdatePlan(selectedPlan);
            }
          }}
          loading={isUpdating}
          submitText="Update Plan"
        >
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Plan Name</label>
                  <Input
                    value={selectedPlan.name}
                    onChange={(e) => setSelectedPlan({...selectedPlan, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedPlan.price}
                    onChange={(e) => setSelectedPlan({...selectedPlan, price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={selectedPlan.description}
                  onChange={(e) => setSelectedPlan({...selectedPlan, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Billing Cycle</label>
                  <Select
                    value={selectedPlan.billingCycle}
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
                    value={selectedPlan.maxUsers || ''}
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
            </div>
          )}
        </FormModal>
      </div>
    </DashboardLayout>
  );
}

export default function AdminPlansPage() {
  return (
    <ErrorHandlerProvider defaultErrorType="toast">
      <AdminPlansPageContent />
    </ErrorHandlerProvider>
  );
}
