'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Square,
  AlertTriangle,
  Factory,
  Package,
  Wrench,
  CheckSquare,
  Star,
  Calendar,
  DollarSign,
  Users,
  Package2,
  Eye,
} from 'lucide-react';
import {
  ProductionPlanResponse as ProductionPlan,
  ProductionStatus,
  ProductionType,
} from '../../../models/production';
import ProductionService from '../../../services/ProductionService';
import { useAuth } from '../../../hooks/useAuth';
import { DashboardLayout } from '../../../components/layout';
import {
  cn,
  getStatusColor,
  getPriorityColor,
  formatDate,
} from '../../../lib/utils';

export default function ProductionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { } = useAuth();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProductionPlan(params.id as string);
    }
  }, [params.id]);

  const fetchProductionPlan = async (id: string) => {
    try {
      setLoading(true);
      const service = new ProductionService();
      const plan = await service.getProductionPlan(id);
      setProductionPlan(plan);
    } catch (error) {
      console.error('Error fetching production plan:', error);
      router.push('/production');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productionPlan) return;

    try {
      const service = new ProductionService();
      await service.deleteProductionPlan(productionPlan.id);
      router.push('/production');
    } catch (error) {
      console.error('Error deleting production plan:', error);
    }
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!productionPlan) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Production plan not found
          </h3>
          <Button onClick={() => router.push('/production')}>
            Back to Production
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/production">Production</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{productionPlan.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/production')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {productionPlan.title}
              </h1>
              <p className="text-gray-600 mt-2">{productionPlan.plan_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            {getStatusIcon(productionPlan.status)}
            <Badge
              variant="outline"
              className={cn('text-sm', getStatusColor(productionPlan.status))}
            >
              {productionPlan.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {getTypeIcon(productionPlan.production_type)}
            <Badge variant="outline" className="text-sm">
              {productionPlan.production_type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <Badge
              variant="outline"
              className={cn(
                'text-sm',
                getPriorityColor(productionPlan.priority),
              )}
            >
              {productionPlan.priority}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion</span>
                <span className="text-sm text-gray-500">
                  {productionPlan.completion_percentage}%
                </span>
              </div>
              <Progress
                value={productionPlan.completion_percentage}
                className="w-full"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Target:</span>
                  <div className="font-medium">
                    {productionPlan.target_quantity}{' '}
                    {productionPlan.unit_of_measure}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Actual:</span>
                  <div className="font-medium">
                    {productionPlan.actual_quantity}{' '}
                    {productionPlan.unit_of_measure}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="font-medium">
                    {productionPlan.estimated_duration_hours}h
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Current Step:</span>
                  <div className="font-medium">
                    {productionPlan.current_step || 'Not started'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="steps">Production Steps</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="mt-1">
                      {productionPlan.description || 'No description provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Production Line
                    </label>
                    <p className="mt-1">
                      {productionPlan.production_line || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Planned Start
                    </label>
                    <p className="mt-1">
                      {productionPlan.planned_start_date
                        ? formatDate(productionPlan.planned_start_date)
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Planned End
                    </label>
                    <p className="mt-1">
                      {productionPlan.planned_end_date
                        ? formatDate(productionPlan.planned_end_date)
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {getCurrencySymbol()}{productionPlan.estimated_material_cost}
                    </div>
                    <div className="text-sm text-gray-600">Material Cost</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol()}{productionPlan.estimated_labor_cost}
                    </div>
                    <div className="text-sm text-gray-600">Labor Cost</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(
                        productionPlan.estimated_material_cost +
                        productionPlan.estimated_labor_cost
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {productionPlan.tags && productionPlan.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {productionPlan.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Materials Required</CardTitle>
              </CardHeader>
              <CardContent>
                {productionPlan.materials_required &&
                productionPlan.materials_required.length > 0 ? (
                  <div className="space-y-4">
                    {productionPlan.materials_required.map(
                      (material: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Package2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {material.material_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {material.quantity} {material.unit}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {getCurrencySymbol()}{material.total_cost}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getCurrencySymbol()}{material.cost_per_unit} per {material.unit}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No materials specified
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Labor Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {productionPlan.labor_requirements &&
                productionPlan.labor_requirements.length > 0 ? (
                  <div className="space-y-4">
                    {productionPlan.labor_requirements.map(
                      (labor: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Users className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">{labor.role}</div>
                              <div className="text-sm text-gray-500">
                                {labor.hours_required} hours
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {getCurrencySymbol()}{labor.total_cost}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getCurrencySymbol()}{labor.hourly_rate}/hour
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No labor requirements specified
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Standards</CardTitle>
              </CardHeader>
              <CardContent>
                {productionPlan.quality_standards ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Standards
                      </label>
                      <p className="mt-1">{productionPlan.quality_standards}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No quality standards specified
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="steps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Steps</CardTitle>
              </CardHeader>
              <CardContent>
                {productionPlan.production_steps &&
                productionPlan.production_steps.length > 0 ? (
                  <div className="space-y-4">
                    {productionPlan.production_steps.map(
                      (step: any) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                              {step.step_number}
                            </div>
                            <div>
                              <div className="font-medium">
                                {step.step_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {step.estimated_duration_minutes} minutes
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {step.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No production steps defined
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {productionPlan.production_schedules &&
                productionPlan.production_schedules.length > 0 ? (
                  <div className="space-y-4">
                    {productionPlan.production_schedules.map(
                      (schedule: any) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {formatDate(schedule.scheduled_start)} -{' '}
                                {formatDate(schedule.scheduled_end)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Capacity: {schedule.capacity_utilization}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {schedule.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No schedules defined
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Production Plan
                </h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete "{productionPlan.title}"? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
