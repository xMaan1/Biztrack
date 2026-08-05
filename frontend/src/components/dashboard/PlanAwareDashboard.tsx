'use client';

import React from 'react';
import AgencyDashboard, { type AgencyStats } from './AgencyDashboard';

interface PlanAwareDashboardProps {
  planType: string;
  stats: any;
  onNavigate: (path: string) => void;
}

export default function PlanAwareDashboard({
  planType,
  stats,
  onNavigate,
}: PlanAwareDashboardProps) {
  return <AgencyDashboard stats={stats as AgencyStats} onNavigate={onNavigate} />;
}
