'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/layout';

export default function HealthcarePatientHistoryPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Patient History</h1>
        <p className="mt-2 text-gray-600">View and manage patient medical history and records.</p>
      </div>
    </DashboardLayout>
  );
}
