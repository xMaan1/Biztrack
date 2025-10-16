'use client';

import React from 'react';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
import { DashboardLayout } from '../../../components/layout';
import InvestmentList from '../../../components/investments/InvestmentList';

export default function InvestmentsPage() {
  return (
    <ModuleGuard module="finance" fallback={<div>You don't have access to Finance module</div>}>
      <InvestmentsContent />
    </ModuleGuard>
  );
}

function InvestmentsContent() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <InvestmentList />
      </div>
    </DashboardLayout>
  );
}
