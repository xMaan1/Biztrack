'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import PlanAwareDashboard from '../../components/dashboard/PlanAwareDashboard';
import { usePlanInfo } from '../../hooks/usePlanInfo';
import { useDashboard } from '../../hooks/useDashboard';

interface DashboardStats {
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

export default function DashboardPage() {
  return (
    <PermissionGuard fallback={<div>Please log in to access the dashboard</div>}>
      <DashboardContent />
    </PermissionGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { planInfo, loading: planLoading } = usePlanInfo();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard();

  // Transform dashboard data to match existing stats interface
  const stats: DashboardStats = dashboardData ? {
    totalProjects: dashboardData.projects.stats.total,
    activeProjects: dashboardData.projects.stats.active,
    completedProjects: dashboardData.projects.stats.completed,
    totalTeamMembers: dashboardData.users.total,
    averageProgress: dashboardData.projects.recent.length > 0 
      ? Math.round(
          dashboardData.projects.recent.reduce(
            (sum, p) => sum + p.completionPercent, 0
          ) / dashboardData.projects.recent.length
        )
      : 0,
    workOrders: dashboardData.workOrders.stats.total,
    equipmentMaintenance: dashboardData.workOrders.stats.draft,
    qualityIssues: dashboardData.workOrders.stats.in_progress,
    productionEfficiency: dashboardData.workOrders.stats.total > 0
      ? Math.round((dashboardData.workOrders.stats.completed / dashboardData.workOrders.stats.total) * 100)
      : 0,
  } : {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTeamMembers: 0,
    averageProgress: 0,
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Show loading while fetching data
  if (planLoading || dashboardLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }


  // Show error if dashboard data failed to load
  if (dashboardError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Dashboard Error
            </h1>
            <p className="text-gray-600 text-lg">
              Failed to load dashboard data: {dashboardError}
            </p>
            <p className="text-gray-500 mt-2">
              Please refresh the page or contact support.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If no plan info, show error or fallback
  if (!planInfo) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Plan Information Not Available
            </h1>
            <p className="text-gray-600 text-lg">
              Unable to load your subscription plan information.
            </p>
            <p className="text-gray-500 mt-2">
              Please contact support or refresh the page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <PlanAwareDashboard
          planType={planInfo.planType}
          stats={stats}
          onNavigate={handleNavigate}
        />
      </div>
    </DashboardLayout>
  );
}
