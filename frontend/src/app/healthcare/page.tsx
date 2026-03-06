'use client';

import React from 'react';
import { DashboardLayout } from '../../components/layout';

export default function HealthcareDashboardPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Healthcare Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview and key metrics for your healthcare workspace.</p>
      </div>
    </DashboardLayout>
  );
}
