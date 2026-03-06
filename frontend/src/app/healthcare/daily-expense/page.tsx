'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/layout';

export default function HealthcareDailyExpensePage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Daily Expense</h1>
        <p className="mt-2 text-gray-600">Track and manage daily expenses.</p>
      </div>
    </DashboardLayout>
  );
}
