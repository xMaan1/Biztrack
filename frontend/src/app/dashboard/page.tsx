"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/ApiService";
import { Project } from "../../models/project/Project";
import { DashboardLayout } from "../../components/layout";
import PlanAwareDashboard from "../../components/dashboard/PlanAwareDashboard";
import { usePlanInfo } from "../../hooks/usePlanInfo";

interface DashboardStats {
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

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { planInfo, loading: planLoading } = usePlanInfo();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTeamMembers: 0,
    averageProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to root route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, usersResponse, workOrdersResponse] =
        await Promise.all([
          apiService.getProjects(),
          apiService.getUsers().catch(() => ({ users: [] })),
          apiService
            .getWorkOrderStats()
            .catch(() => ({
              stats: {
                total: 0,
                draft: 0,
                planned: 0,
                in_progress: 0,
                completed: 0,
                on_hold: 0,
                urgent: 0,
              },
            })),
        ]);

      const projectsData = projectsResponse.projects || [];
      const usersData = usersResponse.users || [];
      const workOrdersData = workOrdersResponse.stats || {
        total: 0,
        draft: 0,
        planned: 0,
        in_progress: 0,
        completed: 0,
        on_hold: 0,
        urgent: 0,
      };

      setProjects(projectsData);

      // Calculate stats
      const totalProjects = projectsData.length;
      const activeProjects = projectsData.filter(
        (p: Project) => p.status === "in_progress",
      ).length;
      const completedProjects = projectsData.filter(
        (p: Project) => p.status === "completed",
      ).length;
      const totalTeamMembers = usersData.length;
      const averageProgress =
        totalProjects > 0
          ? Math.round(
              projectsData.reduce(
                (sum: number, p: Project) => sum + p.completionPercent,
                0,
              ) / totalProjects,
            )
          : 0;

      // Work order stats
      const workOrders = workOrdersData.total || 0;
      const equipmentMaintenance = workOrdersData.draft || 0; // Use draft as maintenance due
      const qualityIssues = workOrdersData.in_progress || 0; // Use in_progress as quality issues
      const productionEfficiency =
        workOrders > 0
          ? Math.round((workOrdersData.completed / workOrders) * 100)
          : 0;

      setStats({
        totalProjects,
        activeProjects,
        completedProjects,
        totalTeamMembers,
        averageProgress,
        workOrders,
        equipmentMaintenance,
        qualityIssues,
        productionEfficiency,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Show loading while checking authentication or fetching data
  if (authLoading || planLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Show loading screen for unauthenticated users (while redirecting)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If no plan info, show error or fallback
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
