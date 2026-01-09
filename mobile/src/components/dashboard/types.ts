export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  workOrders?: number;
  equipmentMaintenance?: number;
  qualityIssues?: number;
  productionEfficiency?: number;
  totalSales?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  customerSatisfaction?: number;
  totalPatients?: number;
  totalAppointments?: number;
  upcomingAppointments?: number;
  medicalRecords?: number;
}

export interface ChartData {
  progressData: {
    labels: string[];
    datasets: Array<{
      data: number[];
    }>;
  };
  activityData: {
    labels: string[];
    datasets: Array<{
      data: number[];
    }>;
  };
}
