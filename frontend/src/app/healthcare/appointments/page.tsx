'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/layout';

export default function HealthcareAppointmentsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
        <p className="mt-2 text-gray-600">Manage patient appointments and scheduling.</p>
      </div>
    </DashboardLayout>
  );
}
