'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { PermissionGuard } from '../../components/guards/PermissionGuard';
import { usePlanInfo } from '../../hooks/usePlanInfo';
import HealthcareDashboard from '../../components/dashboard/HealthcareDashboard';
import StandardPlanDashboard from '../../components/dashboard/StandardPlanDashboard';

export default function DashboardPage() {
  return (
    <PermissionGuard fallback={<div>Please log in to access the dashboard</div>}>
      <DashboardGate />
    </PermissionGuard>
  );
}

function DashboardGate() {
  const { planInfo, loading: planLoading } = usePlanInfo();

  if (planLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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

  if (planInfo.planType === 'healthcare') {
    return <HealthcareDashboard />;
  }

  return <StandardPlanDashboard planInfo={planInfo} />;
}
