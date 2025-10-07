'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout';
import InvestmentList from '../../components/investments/InvestmentList';

export default function InvestmentsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <InvestmentList />
      </div>
    </DashboardLayout>
  );
}
