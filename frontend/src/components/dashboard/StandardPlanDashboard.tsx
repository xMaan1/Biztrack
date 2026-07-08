'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '../layout';
import PlanAwareDashboard from './PlanAwareDashboard';
import type { PlanInfo } from '../../hooks/usePlanInfo';
import { useDashboard, type DashboardData } from '../../hooks/useDashboard';

import type { AgencyStats } from './AgencyDashboard';

interface DashboardStats extends Partial<AgencyStats> {
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

function getTeamMembersFromDashboard(usersData: DashboardData['users'] | undefined) {
  const raw = usersData as { users?: AgencyStats['teamMembers']; recent?: AgencyStats['teamMembers'] };
  if (Array.isArray(raw?.users)) return raw.users;
  if (Array.isArray(raw?.recent)) return raw.recent;
  return [];
}

export default function StandardPlanDashboard({ planInfo }: { planInfo: PlanInfo }) {
  const router = useRouter();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard();

  const stats: DashboardStats = dashboardData ? (() => {
    const teamMembers = getTeamMembersFromDashboard(dashboardData.users);
    const projectStats = dashboardData.projects.stats as DashboardData['projects']['stats'] & {
      on_hold?: number;
    };
    const averageProgress =
      dashboardData.projects.recent.length > 0
        ? Math.round(
            dashboardData.projects.recent.reduce(
              (sum, p) => sum + p.completionPercent,
              0,
            ) / dashboardData.projects.recent.length,
          )
        : 0;

    return {
      totalProjects: projectStats.total,
      activeProjects: projectStats.active,
      completedProjects: projectStats.completed,
      onHoldProjects: projectStats.on_hold ?? 0,
      totalTeamMembers: dashboardData.users.total,
      activeTeamMembers: teamMembers.filter((member) => member.isActive !== false).length,
      averageProgress,
      recentProjects: dashboardData.projects.recent.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        completionPercent: project.completionPercent,
        dueDate: project.dueDate,
      })),
      teamMembers,
      workOrders: dashboardData.workOrders.stats.total,
      equipmentMaintenance: dashboardData.workOrders.stats.draft,
      qualityIssues: dashboardData.workOrders.stats.in_progress,
      productionEfficiency:
        dashboardData.workOrders.stats.total > 0
          ? Math.round(
              (dashboardData.workOrders.stats.completed /
                dashboardData.workOrders.stats.total) *
                100,
            )
          : 0,
    };
  })() : {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalTeamMembers: 0,
    activeTeamMembers: 0,
    averageProgress: 0,
    recentProjects: [],
    teamMembers: [],
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (dashboardLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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
